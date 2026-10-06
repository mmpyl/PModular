import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ElectronicDocumentType } from '@prisma/client';
import { InvoicingService } from './invoicing.service';

describe('InvoicingService', () => {
  const encryptionKey = Buffer.alloc(32, 7).toString('hex');
  const config = { get: jest.fn((key: string) => key === 'NUBEFACT_ENCRYPTION_KEY' ? encryptionKey : undefined) };
  const service = new InvoicingService({} as any, config as any);

  it('cifra el token sin almacenarlo en texto plano y puede descifrarlo', () => {
    const token = 'nubefact-test-token-for-encryption';
    const encrypted = (service as any).encryptToken(token) as string;

    expect(encrypted).not.toContain(token);
    expect((service as any).decryptToken(encrypted)).toBe(token);
  });

  it('acepta solo rutas HTTPS oficiales de Nubefact/PSE', () => {
    expect((service as any).validateNubefactEndpoint('https://api.nubefact.com/api/v1/test').hostname)
      .toBe('api.nubefact.com');
    expect(() => (service as any).validateNubefactEndpoint('http://api.nubefact.com/api/v1/test'))
      .toThrow(BadRequestException);
    expect(() => (service as any).validateNubefactEndpoint('https://example.com/metadata'))
      .toThrow(BadRequestException);
  });

  it('rechaza series ausentes o inválidas y correlativos no positivos', () => {
    expect((service as any).getSeries({ billing: { series: { ticket: 'T001' } } }, ElectronicDocumentType.TICKET)).toBe('T001');
    expect(() => (service as any).getSeries({ billing: { series: { factura: 'serie-muy-larga' } } }, ElectronicDocumentType.FACTURA))
      .toThrow(BadRequestException);
    expect((service as any).getStartingNumber({ billing: { series: { boletaNextNumber: 125 } } }, ElectronicDocumentType.BOLETA)).toBe(125);
    expect(() => (service as any).getStartingNumber({ billing: { series: { boletaNextNumber: 0 } } }, ElectronicDocumentType.BOLETA))
      .toThrow(BadRequestException);
  });

  it('falla de forma explícita si falta la clave local de cifrado', () => {
    const serviceWithoutKey = new InvoicingService({} as any, { get: () => undefined } as any);
    expect(() => (serviceWithoutKey as any).encryptToken('test-token')).toThrow(ServiceUnavailableException);
    expect((serviceWithoutKey as any).getEncryptionKey(false)).toBeNull();
  });

  it('mapea una factura gravada al formato JSON de Nubefact', () => {
    const sale = {
      customer: { taxId: '20123456789', name: 'Cliente SAC', address: 'Av. Lima 123', email: 'cliente@example.test' },
      saleDate: new Date('2026-10-05T12:00:00.000Z'),
      paymentDueDate: null,
      currency: 'PEN',
      items: [{
        productId: 'product-id',
        quantity: 2,
        unitPrice: 50,
        discount: 0,
        taxRate: 0.18,
        subtotal: 100,
        taxAmount: 18,
        total: 118,
        product: { sku: 'SKU-1', name: 'Producto', unit: { symbol: 'NIU' } },
      }],
      taxAmount: 18,
      discount: 0,
      total: 118,
      notes: null,
    };

    const payload = (service as any).buildNubefactPayload(sale, ElectronicDocumentType.FACTURA, 'F001', 27, 'America/Lima');

    expect(payload).toMatchObject({
      operacion: 'generar_comprobante',
      tipo_de_comprobante: 1,
      serie: 'F001',
      numero: 27,
      fecha_de_emision: '05-10-2026',
      cliente_tipo_de_documento: 6,
      cliente_numero_de_documento: '20123456789',
      total_gravada: 100,
      total_igv: 18,
      total: 118,
    });
    expect(payload.items[0]).toMatchObject({ unidad_de_medida: 'NIU', codigo: 'SKU-1', tipo_de_igv: 1 });
  });
});