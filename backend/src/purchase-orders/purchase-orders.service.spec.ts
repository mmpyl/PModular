import { BadRequestException } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersService', () => {
  const service = new PurchaseOrdersService({} as any, {} as any, {} as any);

  it('calcula subtotal, impuesto y descuentos por línea y global sin duplicarlos', () => {
    const result = (service as any).calculateTotals([
      { productId: 'product-1', quantityOrdered: 2, unitCost: 10, discount: 2, taxRate: 0.18 },
    ], 1);

    expect(result.subtotal).toBe(20);
    expect(result.taxAmount).toBe(3.24);
    expect(result.total).toBe(22.24);
    expect(result.items[0].total).toBe(21.24);
  });

  it('rechaza descuentos por línea mayores al subtotal', () => {
    expect(() => (service as any).calculateTotals([
      { productId: 'product-1', quantityOrdered: 1, unitCost: 10, discount: 11 },
    ], 0)).toThrow(BadRequestException);
  });

  it('rechaza descuentos globales mayores al importe de la orden', () => {
    expect(() => (service as any).calculateTotals([
      { productId: 'product-1', quantityOrdered: 1, unitCost: 10, discount: 0, taxRate: 0 },
    ], 11)).toThrow(BadRequestException);
  });

  it('rechaza cantidades ordenadas iguales a cero', () => {
    expect(() => (service as any).calculateTotals([
      { productId: 'product-1', quantityOrdered: 0, unitCost: 10, discount: 0 },
    ], 0)).toThrow(BadRequestException);
  });
});