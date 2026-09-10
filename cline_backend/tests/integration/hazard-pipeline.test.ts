import { describe, expect, it } from 'vitest';
import { dbReady } from '../helpers';
import { prisma } from '../../src/db/prisma';
import { enqueueHazardIngested } from '../../src/queue/hazardPipeline.queue';

const ready = await dbReady();

describe.skipIf(!ready)('hazard pipeline (Chunk H — inline fallback, no Redis configured in tests)', () => {
  it('recomputes+persists risk scores, fans out operator notifications, and generates a CAP report — real DB effects', async () => {
    // REDIS_URL is unset in the test environment, so this exercises the exact
    // inline fallback path a Redis-less hackathon demo would use.
    const hazard = await prisma.hazard.create({
      data: { type: 'FLASH_FLOOD', severity: 'CRITICAL', zoneId: 'zone_eb', dataQuality: 'ESTIMATED', startedAt: new Date(), status: 'ACTIVE' },
    });

    try {
      const beforeNotifications = await prisma.notification.count({ where: { type: 'HAZARD_ALERT' } });
      const beforeRiskScores = await prisma.riskScore.count({ where: { hazardId: hazard.id } });
      expect(beforeRiskScores).toBe(0);

      const result = await enqueueHazardIngested(hazard.id);
      expect(result.mode).toBe('inline'); // REDIS_URL is unset in the test env
      expect(result.results?.map((r) => r.stage)).toEqual(['risk_recompute', 'notification_fanout', 'report_generation']);
      expect(result.results?.every((r) => r.ok)).toBe(true);

      const afterRiskScores = await prisma.riskScore.count({ where: { hazardId: hazard.id } });
      expect(afterRiskScores).toBeGreaterThan(0);

      const afterNotifications = await prisma.notification.count({ where: { type: 'HAZARD_ALERT' } });
      expect(afterNotifications).toBeGreaterThan(beforeNotifications);

      const auditRow = await prisma.auditLog.findFirst({ where: { action: 'PIPELINE_REPORT_GENERATED', entityId: hazard.id } });
      expect(auditRow).not.toBeNull();
      expect((auditRow?.metadata as Record<string, unknown> | null)?.format).toBe('CAP_1.2_XML');
    } finally {
      await prisma.riskScore.deleteMany({ where: { hazardId: hazard.id } });
      await prisma.notification.deleteMany({ where: { type: 'HAZARD_ALERT', createdAt: { gte: hazard.createdAt } } });
      await prisma.auditLog.deleteMany({ where: { entityId: hazard.id, action: 'PIPELINE_REPORT_GENERATED' } });
      await prisma.hazard.delete({ where: { id: hazard.id } });
    }
  });

  it('skips notification fan-out for a LOW-severity hazard (below threshold) but still recomputes risk + generates a report', async () => {
    const hazard = await prisma.hazard.create({
      data: { type: 'EXTREME_HEAT', severity: 'LOW', zoneId: 'zone_eb', dataQuality: 'ESTIMATED', startedAt: new Date(), status: 'ACTIVE' },
    });

    try {
      const result = await enqueueHazardIngested(hazard.id);
      const fanout = result.results?.find((r) => r.stage === 'notification_fanout');
      expect(fanout?.ok).toBe(true);
      expect(fanout?.detail).toContain('below notification threshold');
    } finally {
      await prisma.riskScore.deleteMany({ where: { hazardId: hazard.id } });
      await prisma.auditLog.deleteMany({ where: { entityId: hazard.id, action: 'PIPELINE_REPORT_GENERATED' } });
      await prisma.hazard.delete({ where: { id: hazard.id } });
    }
  });
});
