import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';
import type { PrismaClient } from '@prisma/client';

const ready = await dbReady();
const { prisma }: { prisma: PrismaClient } = await import('../../src/db/prisma');

// The seeded East Basin flash-flood hazard (see prisma/seed-data.ts hz_ff_eb).
const seededHazard = ready ? await prisma.hazard.findFirst({ where: { id: 'hz_ff_eb' } }) : null;

describe.skipIf(!ready || !seededHazard)('GET /api/citizen/hazards/:id', () => {
  it('returns raw hazard measurements + deterministic risk/cascade for its zone', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app).get(`/api/citizen/hazards/${seededHazard!.id}`).set(auth(token));

    expect(res.status).toBe(200);
    const d = res.body.data;

    // Raw hazard fields come from THIS hazard record.
    expect(d.hazard.id).toBe(seededHazard!.id);
    expect(d.hazard.type).toBe(seededHazard!.type);
    expect(d.hazard.rainfallRate).toBe(seededHazard!.rainfallRate);
    expect(d.hazard.dataQuality).toBeTruthy();

    // Deterministic risk/cascade composed from the (unmodified) engine.
    expect(typeof d.risk.score).toBe('number');
    expect(d.risk.level).toBeTruthy();
    expect(Array.isArray(d.corridor.impactedRoads)).toBe(true);
    expect(Array.isArray(d.recommendedActions)).toBe(true);

    // No internal-only fields leak (no unit callsigns/SLAs/audit).
    expect(d).not.toHaveProperty('assignedUnits');
    expect(d).not.toHaveProperty('slaDeadline');
  });

  it('404s for an unknown hazard id', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app).get('/api/citizen/hazards/does-not-exist').set(auth(token));
    expect(res.status).toBe(404);
  });

  it('is CITIZEN-only: government gets 403', async () => {
    const token = await login('government@climateshield.demo');
    const res = await request(app).get(`/api/citizen/hazards/${seededHazard!.id}`).set(auth(token));
    expect(res.status).toBe(403);
  });
});
