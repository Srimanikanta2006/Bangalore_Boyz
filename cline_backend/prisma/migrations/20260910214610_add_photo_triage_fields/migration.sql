-- AlterTable
ALTER TABLE "ReportEvidence" ADD COLUMN     "aiCaption" TEXT,
ADD COLUMN     "aiConfidence" DOUBLE PRECISION,
ADD COLUMN     "aiProvider" TEXT,
ADD COLUMN     "aiVisibleHazards" JSONB,
ADD COLUMN     "aiWaterDepthEstimate" TEXT;
