-- AlterTable
ALTER TABLE "Hazard" ADD COLUMN     "dataQuality" TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO';

-- CreateTable
CREATE TABLE "WeatherSnapshot" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "dataQuality" TEXT NOT NULL DEFAULT 'LIVE_OBSERVED',
    "temperatureC" DOUBLE PRECISION,
    "precipitationMm" DOUBLE PRECISION,
    "rainfallMmPerHour" DOUBLE PRECISION,
    "windSpeedKmh" DOUBLE PRECISION,
    "windDirectionDeg" DOUBLE PRECISION,
    "weatherCode" INTEGER,
    "weatherCondition" TEXT,
    "observedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherSnapshot_zoneId_createdAt_idx" ON "WeatherSnapshot"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "WeatherSnapshot_createdAt_idx" ON "WeatherSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "WeatherSnapshot" ADD CONSTRAINT "WeatherSnapshot_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
