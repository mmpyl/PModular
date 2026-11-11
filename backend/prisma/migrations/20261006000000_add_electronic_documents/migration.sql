CREATE TYPE "ElectronicDocumentType" AS ENUM ('TICKET', 'BOLETA', 'FACTURA');

CREATE TYPE "ElectronicDocumentStatus" AS ENUM (
    'LOCAL',
    'PENDIENTE',
    'ACEPTADO',
    'RECHAZADO',
    'ERROR'
);

CREATE TABLE "electronic_documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "type" "ElectronicDocumentType" NOT NULL,
    "series" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "ElectronicDocumentStatus" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'INTERNAL',
    "providerCode" TEXT,
    "message" TEXT,
    "pdfUrl" TEXT,
    "xmlUrl" TEXT,
    "cdrUrl" TEXT,
    "qrData" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "electronic_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_integrations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "endpointUrl" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "electronic_documents_organizationId_type_series_number_key"
    ON "electronic_documents"("organizationId", "type", "series", "number");
CREATE UNIQUE INDEX "electronic_documents_saleId_type_key"
    ON "electronic_documents"("saleId", "type");
CREATE INDEX "electronic_documents_organizationId_createdAt_idx"
    ON "electronic_documents"("organizationId", "createdAt");
CREATE INDEX "electronic_documents_status_idx"
    ON "electronic_documents"("status");
CREATE UNIQUE INDEX "organization_integrations_organizationId_provider_key"
    ON "organization_integrations"("organizationId", "provider");

ALTER TABLE "electronic_documents"
    ADD CONSTRAINT "electronic_documents_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "electronic_documents"
    ADD CONSTRAINT "electronic_documents_saleId_fkey"
    FOREIGN KEY ("saleId") REFERENCES "sales"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_integrations"
    ADD CONSTRAINT "organization_integrations_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;