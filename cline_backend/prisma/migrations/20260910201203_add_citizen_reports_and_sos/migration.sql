-- CreateEnum
CREATE TYPE "CitizenReportCategory" AS ENUM ('FLASH_FLOOD', 'ROAD_BLOCKED', 'DOWNED_LINE', 'EXTREME_HEAT', 'WATER_MAIN', 'LANDSLIDE_MUD', 'STORM_DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "CitizenReportStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'DISMISSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "EvidenceStorageType" AS ENUM ('LOCAL_DISK', 'EXTERNAL_URL');

-- CreateEnum
CREATE TYPE "SosThreat" AS ENUM ('MEDICAL', 'FIRE_RESCUE', 'FLOOD_BOAT', 'HAZARD_GAS');

-- CreateEnum
CREATE TYPE "SosStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CitizenReport" (
    "id" TEXT NOT NULL,
    "reportCode" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "category" "CitizenReportCategory" NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "zoneId" TEXT NOT NULL,
    "reportedSeverity" "Severity",
    "observations" JSONB,
    "status" "CitizenReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportEvidence" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "storageType" "EvidenceStorageType" NOT NULL,
    "storageRef" TEXT NOT NULL,
    "byteSize" INTEGER,
    "capturedAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SosEvent" (
    "id" TEXT NOT NULL,
    "sosCode" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "zoneId" TEXT NOT NULL,
    "primaryThreat" "SosThreat" NOT NULL,
    "secondaryConditions" JSONB,
    "peopleAffected" INTEGER,
    "note" TEXT,
    "status" "SosStatus" NOT NULL DEFAULT 'OPEN',
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SosEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CitizenReport_reportCode_key" ON "CitizenReport"("reportCode");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenReport_incidentId_key" ON "CitizenReport"("incidentId");

-- CreateIndex
CREATE INDEX "CitizenReport_reporterId_createdAt_idx" ON "CitizenReport"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "CitizenReport_zoneId_idx" ON "CitizenReport"("zoneId");

-- CreateIndex
CREATE INDEX "CitizenReport_status_idx" ON "CitizenReport"("status");

-- CreateIndex
CREATE INDEX "ReportEvidence_reportId_idx" ON "ReportEvidence"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "SosEvent_sosCode_key" ON "SosEvent"("sosCode");

-- CreateIndex
CREATE UNIQUE INDEX "SosEvent_incidentId_key" ON "SosEvent"("incidentId");

-- CreateIndex
CREATE INDEX "SosEvent_requesterId_createdAt_idx" ON "SosEvent"("requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "SosEvent_zoneId_idx" ON "SosEvent"("zoneId");

-- CreateIndex
CREATE INDEX "SosEvent_status_idx" ON "SosEvent"("status");

-- AddForeignKey
ALTER TABLE "CitizenReport" ADD CONSTRAINT "CitizenReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenReport" ADD CONSTRAINT "CitizenReport_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenReport" ADD CONSTRAINT "CitizenReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportEvidence" ADD CONSTRAINT "ReportEvidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CitizenReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosEvent" ADD CONSTRAINT "SosEvent_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosEvent" ADD CONSTRAINT "SosEvent_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosEvent" ADD CONSTRAINT "SosEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
