-- Fase B4: Venta rápida (POS)
-- Soporte de código de barras, productos de alta rotura y marcado de tickets rápidos.

-- Products: código de barras único por organización para escaneo en mostrador
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_fast_sale" BOOLEAN NOT NULL DEFAULT false;

-- Unicidad del barcode dentro de la organización (NULL es permitido y no conflige)
CREATE UNIQUE INDEX IF NOT EXISTS "products_organizationId_barcode_key"
  ON "products" ("organizationId", "barcode")
  WHERE "barcode" IS NOT NULL;

-- Sales: origen del ticket (venta rápida POS vs formulario completo)
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "is_quick_sale" BOOLEAN NOT NULL DEFAULT false;
