import type { RiskLevel } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';

export interface SimulatedSmsResult {
  success: boolean;
  status: 'SENT' | 'FAILED';
  recipient: string;
  message: string;
  timestamp: Date;
}

export interface NotifyZoneOptions {
  customMessage?: string;
  incidentCode?: string;
  hazardType?: string;
}

export interface NotificationQuery {
  zoneId?: string;
  riskLevel?: string;
  page?: number;
  limit?: number;
}

/**
 * SIMULATED SMS SENDER
 *
 * Plug-and-play SMS gateway abstraction. Currently simulates SMS sending by:
 *  1. Formatting & logging structured alert output to server console
 *  2. Returning delivery metadata
 *
 * To integrate a real SMS gateway (MSG91, Twilio, AWS SNS, Infobip) in production:
 * Replace ONLY the internal body of this function with your provider's HTTP SDK call.
 */
export async function sendSimulatedSms(recipient: string, message: string): Promise<SimulatedSmsResult> {
  const timestamp = new Date();
  // eslint-disable-next-line no-console
  console.log(`[SMS_SIMULATED] 📱 Outbound SMS -> Recipient: ${recipient}`);
  // eslint-disable-next-line no-console
  console.log(`[SMS_SIMULATED] 💬 Message: "${message}"`);
  // eslint-disable-next-line no-console
  console.log(`[SMS_SIMULATED] ⏱️ SentAt: ${timestamp.toISOString()} | Channel: sms_simulated | Status: SENT\n`);

  return {
    success: true,
    status: 'SENT',
    recipient,
    message,
    timestamp,
  };
}

/** Default demo subscribers auto-provisioned per zone if none exist */
const DEMO_SUBSCRIBERS_PER_ZONE = [
  { name: 'District Resident Lead', contact: '+919876543210', channel: 'SMS' },
  { name: 'Emergency Command Dispatch', contact: '+919876543211', channel: 'SMS' },
  { name: 'Public Works Field Supervisor', contact: '+919876543212', channel: 'SMS' },
];

/**
 * Core Notification Pipeline Trigger
 *
 * Dispatches simulated SMS alerts to all registered regional subscribers when a zone
 * or asset crosses a risk threshold. Automatically records each alert in `SentAlert`.
 */
export async function notifyZoneSubscribers(
  zoneId: string,
  riskLevel: RiskLevel,
  options: NotifyZoneOptions = {}
) {
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { subscribers: true },
  });

  if (!zone) {
    throw Errors.notFound('Zone', zoneId);
  }

  // Ensure zone has subscribers for the demo
  let subscribers = zone.subscribers;
  if (subscribers.length === 0) {
    const created = await Promise.all(
      DEMO_SUBSCRIBERS_PER_ZONE.map((sub) =>
        prisma.subscriber.create({
          data: {
            name: sub.name,
            contact: sub.contact,
            channel: sub.channel,
            zoneId: zone.id,
          },
        })
      )
    );
    subscribers = created;
  }

  // Compose human-readable alert message (can be customized or fallback-generated)
  const hazardLabel = options.hazardType ? options.hazardType.replace(/_/g, ' ') : 'climate hazard';
  const defaultMessage =
    `EMERGENCY ALERT [ClimateShield]: Zone ${zone.name} (${zone.code}) has crossed risk threshold to ${riskLevel}. ` +
    `Active ${hazardLabel} detected. Residents & emergency crews exercise extreme caution. ` +
    `Avoid low-lying underpasses & follow local evacuation advisories.`;

  const messageText = options.customMessage ?? defaultMessage;

  // Process dispatch to all zone subscribers
  const results = [];
  for (const subscriber of subscribers) {
    const smsResult = await sendSimulatedSms(subscriber.contact, messageText);

    // Write alert audit row to SentAlert table
    const sentAlert = await prisma.sentAlert.create({
      data: {
        zoneId: zone.id,
        subscriberId: subscriber.id,
        recipient: subscriber.contact,
        riskLevel,
        message: messageText,
        channel: 'sms_simulated',
        status: smsResult.status,
      },
    });

    results.push({
      subscriberId: subscriber.id,
      subscriberName: subscriber.name,
      recipient: subscriber.contact,
      alertId: sentAlert.id,
      status: smsResult.status,
    });
  }

  // Also update Zone's current riskLevel to reflect the escalated tier
  await prisma.zone.update({
    where: { id: zone.id },
    data: { riskLevel },
  });

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    zoneCode: zone.code,
    riskLevel,
    messageSent: messageText,
    subscriberCount: subscribers.length,
    notificationsSent: results,
  };
}

/**
 * List recent notifications sent (for live demo dashboard feeds)
 */
export async function listSentAlerts(query: NotificationQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where = {
    ...(query.zoneId ? { zoneId: query.zoneId } : {}),
    ...(query.riskLevel ? { riskLevel: query.riskLevel as RiskLevel } : {}),
  };

  const [alerts, total] = await Promise.all([
    prisma.sentAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        zone: { select: { id: true, name: true, code: true } },
        subscriber: { select: { id: true, name: true, contact: true } },
      },
    }),
    prisma.sentAlert.count({ where }),
  ]);

  const items = alerts.map((a) => ({
    id: a.id,
    zoneId: a.zoneId,
    zoneName: a.zone?.name ?? 'General Zone',
    zoneCode: a.zone?.code ?? 'ALL',
    subscriberName: a.subscriber?.name ?? 'Regional Subscriber',
    recipient: a.recipient,
    riskLevel: a.riskLevel,
    message: a.message,
    channel: a.channel,
    status: a.status,
    createdAt: a.createdAt,
  }));

  return buildPaginated(items, total, page, limit);
}
