import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, InvoiceType } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PseProviderFactory } from '../pse-provider/pse-provider.factory';
import { AuditLogService } from '../audit-log/audit-log.service';
import { VoucherArchiveService } from '../voucher-archive/voucher-archive.service';
import { ElectronicVoucherService } from './electronic-voucher.service';

/**
 * Fase B5 — facturación electrónica (SUNAT vía PSE/OSE).
 * Reglas clave:
 *  - Errores esperados como excepciones HTTP (400/404), nunca `throw new Error` (500).
 *  - Correlativo reservado de forma atómica (UPDATE ... RETURNING) para que dos
 *    comprobantes concurrentes nunca compartan serie+correlativo.
 *  - Reintentos con backoff; tras agotarlos el comprobante queda RECHAZADO
 *    (recuperable con retrySend), sin lanzar 500 al cliente.
 */
describe('ElectronicVoucherService', () => {
  const ORG = 'org-1';
  const USER = 'user-1';

  let prisma: any;
  let provider: { sendInvoice: jest.Mock };
  let factory: any;
  let audit: any;
  let archive: any;
  let service: ElectronicVoucherService;

  const fiscalSettings = {
    organizationId: ORG,
    isConfigured: true,
    ruc: '20512345679',
    razonSocial: 'ACME EIRL',
    direccion: 'Av. Siempre 123',
    ubigeo: '150101',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Lima',
    igvRate: 18,
    pseProvider: 'NUBEFACT',
    serieActualFactura: 'F001',
    serieActualBoleta: 'B001',
    serieActualNotaCredito: 'NC01',
    serieActualNotaDebito: 'ND01',
  };

  const makeSale = (overrides: any = {}) => ({
    id: 'sale-1',
    saleNumber: 'V-202609-0001',
    organizationId: ORG,
    status: 'CERRADA',
    subtotal: 100,
    taxRate: 0.18,
    taxAmount: 18,
    discount: 0,
    total: 118,
    currency: 'PEN',
    customer: { name: 'Cliente SA', taxId: '20111111111', address: 'Calle 1' },
    items: [
      { productId: 'p1', quantity: 2, price: 50, product: { sku: 'SKU1', name: 'Producto 1' } },
    ],
    organization: { fiscalSettings },
    ...overrides,
  });

  beforeEach(() => {
    provider = { sendInvoice: jest.fn() };
    factory = { getProvider: jest.fn().mockReturnValue(provider) };
    audit = { create: jest.fn().mockResolvedValue(undefined) };
    archive = {
      archiveVoucher: jest.fn().mockResolvedValue(undefined),
      getXML: jest.fn(),
      getCDR: jest.fn(),
      verifyIntegrity: jest.fn(),
    };

    prisma = {
      sale: {
        findUnique: jest.fn().mockResolvedValue(makeSale()),
        update: jest.fn().mockResolvedValue({}),
      },
      invoice: {
        findUnique: jest.fn(),
        create: jest.fn(async ({ data }: any) => ({ id: 'inv-1', ...data })),
        update: jest.fn(async ({ data }: any) => ({ id: 'inv-1', ...data })),
        groupBy: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { total: 0 } }),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      // $transaction soporta tanto callback (correlativo atómico) como array (findAll/getStats)
      $transaction: jest.fn(async (arg: any) => {
        if (typeof arg === 'function') {
          return arg({
            $queryRaw: jest.fn().mockResolvedValue([{ ultimosCorrelativos: { F001: 12 } }]),
          });
        }
        return Promise.all(arg);
      }),
    };

    service = new ElectronicVoucherService(
      prisma as unknown as PrismaService,
      factory as unknown as PseProviderFactory,
      audit as unknown as AuditLogService,
      archive as unknown as VoucherArchiveService,
    );
    jest.spyOn(service as any, 'delay').mockResolvedValue(undefined);
  });

  describe('createFromSale()', () => {
    it('crea una FACTURA F001-00000012 con correlativo atómico cuando el cliente tiene RUC', async () => {
      const invoice = await service.createFromSale('sale-1', USER);

      expect(invoice).toMatchObject({
        type: InvoiceType.FACTURA,
        series: 'F001',
        correlation: '00000012',
        status: InvoiceStatus.PENDIENTE,
        total: 118,
      });
      // El correlativo se reservó con UPDATE ... RETURNING (no con read+write).
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(audit.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ event: 'INVOICE_CREATED' }) }),
      );
    });

    it('usa BOLETA para consumidor final sin documento fiscal', async () => {
      prisma.sale.findUnique.mockResolvedValue(
        makeSale({ customer: { name: 'Juan Pérez', taxId: null, address: null } }),
      );

      const invoice = await service.createFromSale('sale-1', USER);
      expect(invoice.type).toBe(InvoiceType.BOLETA);
      expect(invoice.series).toBe('B001');
    });

    it('lanza NotFoundException (404) si la venta no existe', async () => {
      prisma.sale.findUnique.mockResolvedValue(null);
      await expect(service.createFromSale('missing', USER)).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException (400) si la venta no está cerrada', async () => {
      prisma.sale.findUnique.mockResolvedValue(makeSale({ status: 'ABIERTA' }));
      await expect(service.createFromSale('sale-1', USER)).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException (400) si ya existe un comprobante para la venta', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-x' });
      await expect(service.createFromSale('sale-1', USER)).rejects.toThrow(
        /Ya existe un comprobante/,
      );
    });

    it('lanza BadRequestException (400) si la organización no está configurada fiscalmente', async () => {
      prisma.sale.findUnique.mockResolvedValue(
        makeSale({ organization: { fiscalSettings: { ...fiscalSettings, isConfigured: false } } }),
      );
      await expect(service.createFromSale('sale-1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendToPSE()', () => {
    const pendingInvoice = () => ({
      id: 'inv-1',
      organizationId: ORG,
      issuedBy: USER,
      status: InvoiceStatus.PENDIENTE,
      series: 'F001',
      correlation: '00000012',
      type: InvoiceType.FACTURA,
      subtotal: 100,
      taxRate: 0.18,
      taxAmount: 18,
      discount: 0,
      total: 118,
      currency: 'PEN',
      customerName: 'Cliente SA',
      customerTaxId: '20111111111',
      issueDate: new Date(),
      saleId: 'sale-1',
      sale: { organization: { fiscalSettings }, items: [{ productId: 'p1', quantity: 2, price: 50, product: { sku: 'SKU1', name: 'Producto 1' } }] },
    });

    beforeEach(() => {
      prisma.invoice.findUnique.mockResolvedValue(pendingInvoice());
    });

    it('acepta el comprobante, guarda el CDR y lo archiva (retención FE7)', async () => {
      provider.sendInvoice.mockResolvedValue({
        success: true,
        ticket: 'uuid-1',
        cdr: { codigoRespuesta: '0', mensaje: 'OK', hash: 'abc', xmlContent: '<cdr/>' },
      });

      const result = await service.sendToPSE('inv-1');

      expect(result.success).toBe(true);
      const accepted = prisma.invoice.update.mock.calls.some(
        ([c]: any) => c.data.status === InvoiceStatus.ACEPTADO,
      );
      expect(accepted).toBe(true);
      expect(archive.archiveVoucher).toHaveBeenCalledWith(
        'inv-1',
        expect.stringContaining('<Invoice'),
        '<cdr/>',
      );
    });

    it('tras 3 intentos fallidos devuelve success=false y deja el comprobante RECHAZADO (sin 500)', async () => {
      provider.sendInvoice.mockRejectedValue(new Error('timeout del proveedor'));

      const result = await service.sendToPSE('inv-1');

      expect(provider.sendInvoice).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      const rejectedCall = prisma.invoice.update.mock.calls.find(
        ([c]: any) => c.data.status === InvoiceStatus.RECHAZADO,
      );
      expect(rejectedCall).toBeDefined();
    });

    it('un fallo de archivado NO revierte la aceptación del comprobante', async () => {
      provider.sendInvoice.mockResolvedValue({
        success: true,
        cdr: { codigoRespuesta: '0', mensaje: 'OK', hash: 'abc', xmlContent: '<cdr/>' },
      });
      archive.archiveVoucher.mockRejectedValue(new Error('S3 caído'));

      const result = await service.sendToPSE('inv-1');

      expect(result.success).toBe(true);
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: InvoiceStatus.ACEPTADO }) }),
      );
    });

    it('rechaza enviar un comprobante que no está PENDIENTE/RECHAZADO (400)', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        ...pendingInvoice(),
        status: InvoiceStatus.ACEPTADO,
      });
      await expect(service.sendToPSE('inv-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('retrySend()', () => {
    it('solo permite reintentar comprobantes RECHAZADOS', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: InvoiceStatus.ACEPTADO });
      await expect(service.retrySend('inv-1')).rejects.toThrow(/Solo se pueden reintentar/);
    });

    it('reactiva a PENDIENTE y reintenta el envío', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({ id: 'inv-1', status: InvoiceStatus.RECHAZADO })
        .mockResolvedValue({
          id: 'inv-1',
          organizationId: ORG,
          issuedBy: USER,
          status: InvoiceStatus.PENDIENTE,
          series: 'F001',
          correlation: '00000012',
          subtotal: 100,
          taxRate: 0.18,
          taxAmount: 18,
          discount: 0,
          total: 118,
          currency: 'PEN',
          customerName: 'Cliente',
          issueDate: new Date(),
          saleId: null,
          sale: {
            organization: { fiscalSettings },
            items: [{ productId: 'p1', quantity: 1, price: 100, product: { sku: 'S', name: 'P' } }],
          },
        });
      provider.sendInvoice.mockResolvedValue({
        success: true,
        cdr: { codigoRespuesta: '0', mensaje: 'OK', hash: 'h', xmlContent: '<x/>' },
      });

      const result = await service.retrySend('inv-1');
      expect(result.success).toBe(true);
    });
  });

  describe('cancelInvoice()', () => {
    it('genera una NOTA_CREDITO negativa y anula el comprobante original', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        organizationId: ORG,
        issuedBy: USER,
        status: InvoiceStatus.ACEPTADO,
        type: InvoiceType.FACTURA,
        series: 'F001',
        correlation: '00000012',
        subtotal: 100,
        taxAmount: 18,
        total: 118,
        currency: 'PEN',
        customerName: 'Cliente SA',
        customerTaxId: '20111111111',
        organization: { fiscalSettings },
      });
      provider.sendInvoice.mockResolvedValue({
        success: true,
        cdr: { codigoRespuesta: '0', mensaje: 'OK', hash: 'h', xmlContent: '<x/>' },
      });

      const updated = await service.cancelInvoice('inv-1', 'Devolución', USER);

      const nc = prisma.invoice.create.mock.calls[0][0].data;
      expect(nc.type).toBe(InvoiceType.NOTA_CREDITO);
      expect(Number(nc.total)).toBe(-118);
      expect(updated.status).toBe(InvoiceStatus.ANULADO);
    });

    it('no permite anular un comprobante ya anulado (400)', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ id: 'inv-1', status: InvoiceStatus.ANULADO });
      await expect(service.cancelInvoice('inv-1', 'motivo', USER)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
