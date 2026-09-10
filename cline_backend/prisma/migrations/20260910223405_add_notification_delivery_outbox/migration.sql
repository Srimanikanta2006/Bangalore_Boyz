-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryChannel" TEXT,
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "lastDeliveryError" TEXT;

-- CreateIndex
CREATE INDEX "Notification_deliveryStatus_idx" ON "Notification"("deliveryStatus");
