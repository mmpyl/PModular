-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_ADMIN', 'SUPPORT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "platformRole" "PlatformRole";
