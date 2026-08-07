-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'PENDING';
