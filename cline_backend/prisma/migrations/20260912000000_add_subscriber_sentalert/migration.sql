-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentAlert" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "subscriberId" TEXT,
    "recipient" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'sms_simulated',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscriber_zoneId_idx" ON "Subscriber"("zoneId");

-- CreateIndex
CREATE INDEX "SentAlert_zoneId_createdAt_idx" ON "SentAlert"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "SentAlert_subscriberId_idx" ON "SentAlert"("subscriberId");

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentAlert" ADD CONSTRAINT "SentAlert_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentAlert" ADD CONSTRAINT "SentAlert_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

