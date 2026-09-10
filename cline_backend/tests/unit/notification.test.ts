import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/prisma';
import { notifyZoneSubscribers, listSentAlerts, sendSimulatedSms } from '../../src/services/notification.service';

describe('Notification Pipeline & Simulated SMS Gateway', () => {
  it('sendSimulatedSms returns SENT status and logs notification', async () => {
    const result = await sendSimulatedSms('+919999988888', 'Test evacuation alert');
    expect(result.success).toBe(true);
    expect(result.status).toBe('SENT');
    expect(result.recipient).toBe('+919999988888');
    expect(result.message).toBe('Test evacuation alert');
  });

  it('notifyZoneSubscribers seeds subscribers, dispatches alerts, and writes SentAlert rows', async () => {
    // 1. Get or create a test zone
    let zone = await prisma.zone.findFirst();
    if (!zone) {
      zone = await prisma.zone.create({
        data: {
          name: 'Test Zone North',
          code: 'TEST_Z_N',
          latitude: 13.08,
          longitude: 80.27,
          riskLevel: 'MODERATE',
        },
      });
    }

    // 2. Create a test subscriber for this zone
    const subscriber = await prisma.subscriber.create({
      data: {
        name: 'Unit Test Resident',
        contact: '+919123456789',
        channel: 'SMS',
        zoneId: zone.id,
      },
    });

    // 3. Trigger notification pipeline for zone
    const result = await notifyZoneSubscribers(zone.id, 'CRITICAL', {
      customMessage: 'CRITICAL ALERT: Flash flood inundation warning for test zone.',
    });

    expect(result.zoneId).toBe(zone.id);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.subscriberCount).toBeGreaterThanOrEqual(1);

    // 4. Assert a row was created in SentAlert database table
    const alertRow = await prisma.sentAlert.findFirst({
      where: { zoneId: zone.id, recipient: subscriber.contact },
      orderBy: { createdAt: 'desc' },
    });

    expect(alertRow).not.toBeNull();
    expect(alertRow?.recipient).toBe('+919123456789');
    expect(alertRow?.riskLevel).toBe('CRITICAL');
    expect(alertRow?.status).toBe('SENT');
    expect(alertRow?.channel).toBe('sms_simulated');
    expect(alertRow?.message).toContain('Flash flood inundation warning');

    // 5. Test listSentAlerts query
    const listResult = await listSentAlerts({ zoneId: zone.id });
    expect(listResult.items.length).toBeGreaterThanOrEqual(1);
    expect(listResult.items[0].recipient).toBe('+919123456789');
  });
});
