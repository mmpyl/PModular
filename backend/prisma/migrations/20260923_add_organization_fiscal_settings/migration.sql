-- CreateTable
CREATE TABLE "organization_fiscal_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "direccion" TEXT NOT NULL,
    "ubige" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "seriesAutorizadas" JSON NOT NULL DEFAULT '{}',
    "serieActualFactura" TEXT NOT NULL DEFAULT 'F001',
    "serieActualBoleta" TEXT NOT NULL DEFAULT 'B001',
    "serieActualNotaCredito" TEXT NOT NULL DEFAULT 'FC01',
    "serieActualNotaDebito" TEXT NOT NULL DEFAULT 'FD01',
    "ultimosCorrelativos" JSON NOT NULL DEFAULT '{}',
    "pseProvider" TEXT,
    "pseUsername" TEXT,
    "psePassword" TEXT,
    "pseEnvironment" TEXT NOT NULL DEFAULT 'BETA',
    "certificadoDigital" TEXT,
    "certificadoPassword" TEXT,
    "igvRate" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "icbperRate" DECIMAL(5,2),
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "lastSunatSync" TIMESTAMP(3),
    "notasInternas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_fiscal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_fiscal_settings_organizationId_key" ON "organization_fiscal_settings"("organizationId");

-- CreateIndex
CREATE INDEX "organization_fiscal_settings_organizationId_idx" ON "organization_fiscal_settings"("organizationId");

-- CreateIndex
CREATE INDEX "organization_fiscal_settings_ruc_idx" ON "organization_fiscal_settings"("ruc");

-- AddForeignKey
ALTER TABLE "organization_fiscal_settings" ADD CONSTRAINT "organization_fiscal_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
