import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
import { AccountService } from '../account/account.service';
import { SalesService } from './sales.service';

/**
 * Fase B1 — cuenta corriente / ventas a crédito (fiado).
 * Cubre: cálculo de vencimiento por término de pago, asiento CREDITO al completar,
 * abono DEBITO al procesar pagos y —crítico— la validación de límite de crédito
 * SIN condición de carrera (lock FOR UPDATE + relectura del saldo).
 */
describe('SalesService (Fase B1 — ventas a crédito)', () => {
  const ORG = 'org-1';
  const USER = 'user-1';
  const CUSTOMER_ID = 'customer-1';

  let prisma: any;
  /** Estado mutable del cliente: se actualiza al "incrementar" currentBalance. */
  let customerRow: { id: string; name: string; creditLimit: any; currentBalance: any };
  /** Registra cada $executeRaw para verificar el SELECT ... FOR UPDATE. */
  let rawCalls: any[];
  /** Si está definido, hace que la lectura post-lock devuelva este saldo (otra tx ganó). */
  let balanceAfterLock: number | undefined;
  let lastTx: any;

  const makeSale = (overrides: Partial<Record<string, any>> = {}) => ({
    id: 'sale-1',
    saleNumber: 'V-202609-0001',
    organizationId: ORG,
    customerId: CUSTOMER_ID,
    status: 'CONFIRMADA',
    paymentTerm: 'CREDITO_30_DIAS',
    paymentDueDate: null,
    amountPaid: 0,
    amountPending: 100,
    total: 118,
    items: [],
    payments: [],
    ...overrides,
  });

  beforeEach(() => {
    customerRow = { id: CUSTOMER_ID, name: 'Cliente Fiado', creditLimit: 500, currentBalance: 0 };
    rawCalls = [];
    balanceAfterLock = undefined;

    const tx: any = {
      businessEntity: {
        findFirst: jest.fn(async ({ where }: any) =>
          where.id === customerRow.id ? { ...customerRow } : null,
        ),
        findUnique: jest.fn(async () =>
          balanceAfterLock !== undefined
            ? { ...customerRow, currentBalance: balanceAfterLock }
            : { ...customerRow },
        ),
        update: jest.fn(async ({ data }: any) => {
          if (data.currentBalance?.increment != null) {
            customerRow.currentBalance = Number(customerRow.currentBalance) + Number(data.currentBalance.increment);
          }
          return { ...customerRow };
        }),
      },
      sale: {
        update: jest.fn(async ({ data }: any) => ({ ...makeSale(), ...data })),
      },
      payment: {
        create: jest.fn(async ({ data }: any) => ({ id: 'payment-1', ...data })),
      },
      saleItem: { update: jest.fn() },
      customerAccountEntry: { create: jest.fn() },
      $executeRaw: jest.fn(async (query: any) => {
        rawCalls.push(query);
        return 1;
      }),
    };
    lastTx = tx;

    prisma = {
      sale: {
        findFirst: jest.fn().mockResolvedValue(makeSale()),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      businessEntity: {
        findFirst: jest.fn(async () => ({ ...customerRow })),
      },
      $transaction: jest.fn(async (fn: any) => fn(tx)),
    };

    jest.useFakeTimers({ advanceTimers: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const buildService = () => {
    const inventoryService = { adjustStock: jest.fn() } as unknown as InventoryService;
    const stockMovementService = {
      adjustStockInTransaction: jest
        .fn()
        .mockResolvedValue({ batch: null }),
    } as unknown as StockMovementService;
    // Espía el método real para capturar los parámetros sin tocar la BD.
    const accountService = {
      createSaleLinkedEntry: jest.fn(async (_tx: any, params: any) => {
        // Simula el incremento de currentBalance que haría la implementación real.
        const delta = params.type === 'CREDITO' ? params.amount : -params.amount;
        customerRow.currentBalance = Number(customerRow.currentBalance) + delta;
        return { id: 'entry-1', ...params };
      }),
    } as unknown as AccountService;

    const service = new SalesService(prisma, inventoryService, stockMovementService, accountService);
    return { service, accountService, stockMovementService };
  };

  describe('complete() — venta fiada', () => {
    it('genera el asiento CREDITO con dueDate según el término de pago (B1)', async () => {
      const { service, accountService } = buildService();

      await service.complete(ORG, USER, 'sale-1');

      expect(accountService.createSaleLinkedEntry).toHaveBeenCalledTimes(1);
      const [txArg, params] = (accountService.createSaleLinkedEntry as jest.Mock).mock.calls[0];
      expect(txArg).toBe(lastTx); // dentro de la misma transacción
      expect(params).toMatchObject({
        organizationId: ORG,
        customerId: CUSTOMER_ID,
        type: 'CREDITO',
        amount: 100,
        referenceType: 'SALE',
        referenceId: 'sale-1',
        createdBy: USER,
      });
      expect(params.dueDate).toBeInstanceOf(Date);
      const days = Math.round(
        (params.dueDate.getTime() - Date.now()) / (24 * 3600 * 1000),
      );
      expect(days).toBe(30); // CREDITO_30_DIAS
    });

    it('respeta un paymentDueDate explícito por encima del término', async () => {
      const due = new Date('2026-12-31T00:00:00Z');
      prisma.sale.findFirst.mockResolvedValue(makeSale({ paymentDueDate: due }));
      const { service, accountService } = buildService();

      await service.complete(ORG, USER, 'sale-1');

      const [, params] = (accountService.createSaleLinkedEntry as jest.Mock).mock.calls[0];
      expect(params.dueDate).toEqual(due);
    });

    it('no genera asiento para una venta de contado', async () => {
      prisma.sale.findFirst.mockResolvedValue(makeSale({ paymentTerm: 'CONTADO' }));
      const { service, accountService } = buildService();

      await service.complete(ORG, USER, 'sale-1');

      expect(accountService.createSaleLinkedEntry).not.toHaveBeenCalled();
    });

    it('rechaza con 400 si la venta no está CONFIRMADA', async () => {
      prisma.sale.findFirst.mockResolvedValue(makeSale({ status: 'COMPLETADA' }));
      const { service } = buildService();

      await expect(service.complete(ORG, USER, 'sale-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete() — límite de crédito sin race condition', () => {
    it('bloquea la fila del cliente con SELECT ... FOR UPDATE antes de validar', async () => {
      const { service } = buildService();

      await service.complete(ORG, USER, 'sale-1');

      expect(rawCalls.length).toBeGreaterThan(0);
      const sql = String(rawCalls[0]);
      expect(sql).toMatch(/FOR UPDATE/i);
      expect(sql).toMatch(/business_entities/i);
    });

    it('excede el límite solo si el saldo RELEÍDO tras el lock lo permite (segunda venta concurrente)', async () => {
      // Saldo inicial 450, límite 500, pendiente 100 → proyectado 550 > 500.
      customerRow.currentBalance = 450;
      const { service, accountService } = buildService();

      await expect(service.complete(ORG, USER, 'sale-1')).rejects.toThrow(
        BadRequestException,
      );
      // El asiento contable NO debe generarse cuando la validación falla.
      expect(accountService.createSaleLinkedEntry).not.toHaveBeenCalled();
    });

    it('permite la venta si el saldo post-lock (releído) queda dentro del límite', async () => {
      // Primera lectura: 100 (dentro de límite). Dentro de la transacción procede normal.
      customerRow.currentBalance = 100;
      const { service, accountService } = buildService();

      await service.complete(ORG, USER, 'sale-1');

      expect(accountService.createSaleLinkedEntry).toHaveBeenCalledTimes(1);
      // currentBalance quedó incrementado por el asiento (simulado).
      expect(Number(customerRow.currentBalance)).toBe(200);
    });

    it('usa el saldo fresco post-lock aunque la primera lectura pareciera válida', async () => {
      // Escenario de carrera: al leer, el saldo era 100; otra transacción completó
      // otra venta y dejó 450 antes de que obtuviéramos el lock. Debe rechazarse.
      customerRow.currentBalance = 100;
      balanceAfterLock = 450;
      const { service, accountService } = buildService();

      await expect(service.complete(ORG, USER, 'sale-1')).rejects.toThrow(
        /límite de crédito/,
      );
      expect(accountService.createSaleLinkedEntry).not.toHaveBeenCalled();
    });

    it('no aplica el lock cuando el cliente no tiene límite configurado', async () => {
      customerRow.creditLimit = null;
      const { service } = buildService();

      await service.complete(ORG, USER, 'sale-1');

      expect(rawCalls.length).toBe(0);
    });
  });

  describe('processPayment() — abono a cuenta (B1)', () => {
    it('registra el pago, actualiza montos y genera el asiento DEBITO en la misma transacción', async () => {
      const { service, accountService } = buildService();

      const result = await service.processPayment(ORG, USER, 'sale-1', {
        amount: 40,
        method: 'EFECTIVO',
      } as any);

      expect(lastTx.payment.create).toHaveBeenCalled();
      const saleUpdate = lastTx.sale.update.mock.calls[0][0];
      expect(saleUpdate.data).toMatchObject({ amountPaid: 40, amountPending: 60 });

      const [txArg, params] = (accountService.createSaleLinkedEntry as jest.Mock).mock.calls[0];
      expect(txArg).toBe(lastTx);
      expect(params).toMatchObject({
        type: 'DEBITO',
        amount: 40,
        referenceType: 'PAYMENT',
        customerId: CUSTOMER_ID,
      });
      expect(result.sale.amountPending).toBe(60);
    });

    it('rechaza pagos sobre una venta ya saldada', async () => {
      prisma.sale.findFirst.mockResolvedValue(makeSale({ amountPending: 0 }));
      const { service } = buildService();

      await expect(
        service.processPayment(ORG, USER, 'sale-1', { amount: 10, method: 'EFECTIVO' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
