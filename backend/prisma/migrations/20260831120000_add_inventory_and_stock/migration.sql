-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('INGRESO', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "MovementReason" AS ENUM (
  'COMPRA', 'PRODUCCION', 'DEVOLUCION_CLIENTE', 'ENTRADA_INICIAL',
  'VENTA', 'MERMA', 'ROBO', 'OBSOLETO', 'CONSUMO_INTERNO',
  'CONTEO_FISICO', 'ERROR_SISTEMA',
  'TRANSFERENCIA_ENTRADA', 'TRANSFERENCIA_SALIDA'
);

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVO', 'RETENIDO', 'VENCIDO', 'AGOTADO');

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "lastCountedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "reason" "MovementReason" NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "isPositive" BOOLEAN NOT NULL,
    "batchId" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "serialNumber" TEXT,
    "manufacturingDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVO',
    "initialQuantity" DECIMAL(15,4) NOT NULL,
    "currentQuantity" DECIMAL(15,4) NOT NULL,
    "unitCost" DECIMAL(12,4) NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_productId_organizationId_key" ON "inventory_items"("productId", "organizationId");
CREATE INDEX "inventory_items_organizationId_idx" ON "inventory_items"("organizationId");
CREATE INDEX "inventory_items_productId_idx" ON "inventory_items"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_organizationId_idx" ON "stock_movements"("organizationId");
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");
CREATE INDEX "stock_movements_reason_idx" ON "stock_movements"("reason");
CREATE INDEX "stock_movements_referenceType_referenceId_idx" ON "stock_movements"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "batches_productId_batchNumber_organizationId_key" ON "batches"("productId", "batchNumber", "organizationId");
CREATE INDEX "batches_organizationId_idx" ON "batches"("organizationId");
CREATE INDEX "batches_productId_idx" ON "batches"("productId");
CREATE INDEX "batches_expirationDate_idx" ON "batches"("expirationDate");
CREATE INDEX "batches_status_idx" ON "batches"("status");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "batches" ADD CONSTRAINT "batches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "batches" ADD CONSTRAINT "batches_productId_organizationId_fkey" FOREIGN KEY ("productId", "organizationId") REFERENCES "inventory_items"("productId", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
