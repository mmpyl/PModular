-- AlterTable
ALTER TABLE "business_entities" ADD COLUMN     "creditLimit" DECIMAL(12,2),
ADD COLUMN     "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;
