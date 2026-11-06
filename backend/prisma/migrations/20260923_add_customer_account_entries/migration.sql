-- Fase B1: Cuenta corriente / fiado formal

-- CreateEnum
CREATE TYPE "AccountEntryType" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "AccountEntryStatus" AS ENUM ('VIGENTE', 'ANULADO');

-- AlterTable
ALTER TABLE "business_entities" ADD COLUMN     "creditDays" INTEGER;

-- CreateTable
CREATE TABLE "customer_account_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "AccountEntryType" NOT NULL,
    "status" "AccountEntryStatus" NOT NULL DEFAULT 'VIGENTE',
    "amount" DECIMAL(12,2) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "dueDate" TIMESTAMP(3),
    "description" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_account_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_account_entries_organizationId_entryNumber_key" ON "customer_account_entries"("organizationId", "entryNumber");

-- CreateIndex
CREATE INDEX "customer_account_entries_organizationId_customerId_createdAt_idx" ON "customer_account_entries"("organizationId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "customer_account_entries_organizationId_referenceType_referenceId_idx" ON "customer_account_entries"("organizationId", "referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "customer_account_entries_dueDate_status_idx" ON "customer_account_entries"("dueDate", "status");

-- AddForeignKey
ALTER TABLE "customer_account_entries" ADD CONSTRAINT "customer_account_entries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "business_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_account_entries" ADD CONSTRAINT "customer_account_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
