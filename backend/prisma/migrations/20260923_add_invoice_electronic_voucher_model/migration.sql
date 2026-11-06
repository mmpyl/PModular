-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('FACTURA', 'BOLETA', 'NOTA_CREDITO', 'NOTA_DEBITO');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDIENTE', 'ENVIADO', 'ACEPTADO', 'RECHAZADO', 'ANULADO');

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "series" VARCHAR(255) NOT NULL,
    "correlation" VARCHAR(255) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDIENTE',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(255) NOT NULL DEFAULT 'PEN',
    "customerName" VARCHAR(255),
    "customerTaxId" VARCHAR(255),
    "customerAddress" TEXT,
    "sunatResponseCode" VARCHAR(255),
    "sunatResponseMessage" TEXT,
    "cdrHash" VARCHAR(255),
    "cdrXml" TEXT,
    "ubige" VARCHAR(255),
    "uuid" VARCHAR(255),
    "notes" TEXT,
    "internalNotes" TEXT,
    "issuedBy" VARCHAR(255) NOT NULL,
    "saleId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoices_organizationId_idx" ON "invoices"("organizationId");

-- CreateIndex
CREATE INDEX "invoices_type_idx" ON "invoices"("type");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_saleId_idx" ON "invoices"("saleId");

-- CreateIndex
CREATE INDEX "invoices_series_correlation_idx" ON "invoices"("series", "correlation");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_saleId_key" ON "invoices"("saleId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_saleId_fkey" 
    FOREIGN KEY ("saleId") REFERENCES "sales"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
