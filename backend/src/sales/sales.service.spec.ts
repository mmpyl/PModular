import { BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  const service = new SalesService({} as any, {} as any, {} as any);

  it('calcula impuesto y descuento global sin duplicar descuentos de línea', () => {
    const result = (service as any).calculateTotals([
      { productId: 'product-1', quantity: 2, unitPrice: 10, discount: 2, taxRate: 0.18 },
    ], 1);

    expect(result.subtotal).toBe(20);
    expect(result.taxAmount).toBe(3.24);
    expect(result.discount).toBe(3);
    expect(result.total).toBe(20.24);
    expect(result.items[0].total).toBe(21.24);
  });

  it('rechaza descuentos de línea mayores a su subtotal', () => {
    expect(() => (service as any).calculateTotals([
      { productId: 'product-1', quantity: 1, unitPrice: 10, discount: 11 },
    ], 0)).toThrow(BadRequestException);
  });

  it('rechaza descuentos globales mayores al saldo tras descuentos por línea', () => {
    expect(() => (service as any).calculateTotals([
      { productId: 'product-1', quantity: 1, unitPrice: 10, discount: 2, taxRate: 0 },
    ], 9)).toThrow(BadRequestException);
  });

  it('rechaza cantidades cero o negativas', () => {
    expect(() => (service as any).calculateTotals([
      { productId: 'product-1', quantity: 0, unitPrice: 10 },
    ], 0)).toThrow(BadRequestException);
  });

  it('rechaza tasas de impuesto fuera de rango', () => {
    expect(() => (service as any).calculateTotals([
      { productId: 'product-1', quantity: 1, unitPrice: 10, taxRate: 1.2 },
    ], 0)).toThrow(BadRequestException);
  });
});