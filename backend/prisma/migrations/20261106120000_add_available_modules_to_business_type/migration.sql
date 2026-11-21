ALTER TABLE "business_types"
ADD COLUMN "availableModules" JSONB NOT NULL DEFAULT '[]';

UPDATE "business_types"
SET "availableModules" = CASE "code"
  WHEN 'BODEGA' THEN '["inventario", "ventas", "compras", "caja"]'::jsonb
  WHEN 'FERRETERIA' THEN '["inventario", "ventas", "compras", "caja", "fraccionamiento"]'::jsonb
  WHEN 'FARMACIA' THEN '["inventario", "ventas", "compras", "caja", "lotes", "recetas"]'::jsonb
  ELSE "defaultModules"
END;

UPDATE "organizations" AS organization
SET "enabledModules" = business_type."defaultModules"
FROM "business_types" AS business_type
WHERE organization."businessTypeId" = business_type.id
  AND organization."enabledModules" = '[]'::jsonb
  AND business_type."defaultModules" <> '[]'::jsonb;