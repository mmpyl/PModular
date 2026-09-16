import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  parentId: z.string().nullable(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const unitSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  symbol: z.string().optional(),
  isFractionable: z.boolean().optional(),
});

export type UnitFormData = z.infer<typeof unitSchema>;

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  sku: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  cost: z.number().min(0, 'El costo debe ser mayor o igual a 0').optional(),
  categoryId: z.string().nullable(),
  unitId: z.string().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
