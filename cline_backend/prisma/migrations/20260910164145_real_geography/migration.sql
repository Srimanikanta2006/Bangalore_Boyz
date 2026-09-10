-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssetType" ADD VALUE 'CLINIC';
ALTER TYPE "AssetType" ADD VALUE 'SCHOOL';

-- AlterTable
ALTER TABLE "HistoricalEvent" ADD COLUMN     "dataQuality" TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO';

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "dataQuality" TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO';

-- AlterTable
ALTER TABLE "InfrastructureAsset" ADD COLUMN     "dataQuality" TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO',
ADD COLUMN     "geometryJson" JSONB,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO',
ADD COLUMN     "sourceId" TEXT;

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "dataQuality" TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO',
ADD COLUMN     "sourceId" TEXT;
