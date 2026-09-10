import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';
import type { PrismaClient } from '@prisma/client';

const ready = await dbReady();
const { prisma }: { prisma: PrismaClient } = await import('../../src/db/prisma');

const LAT = 13.062;
const LON = 80.275;

describe.skipIf(!ready)('Citizen emergency SOS', () => {
  it('creates an SOS, an auto-linked CRITICAL incident, and notifies operators', async () => {
    const token = await login('citizen@climateshield.demo');

    const before = await prisma.notification.count({ where: { type: 'SOS_ALERT' } });

    const res = await request(app)
      .post('/api/citizen/sos')
      .set(auth(token))
      .send({ latitude: LAT, longitude: LON, primaryThreat: 'FLOOD_BOAT', peopleAffected: 3, note: 'Stranded on rooftop' });

    expect(res.status).toBe(201);
    const d = res.body.data;
    expect(d.sosCode).toMatch(/^SOS-\d{3}$/);
    expect(d.status).toBe('OPEN');
    expect(d.incident).toBeTruthy();
    expect(d.disclaimer).toMatch(/does NOT/i);

    // The linked incident is CRITICAL severity.
    const incident = await prisma.incident.findUnique({ where: { id: d.incident.id } });
    expect(incident?.severity).toBe('CRITICAL');

    // Operators (GOVERNMENT_OPERATOR/DISPATCHER/ADMIN) were notified.
    const after = await prisma.notification.count({ where: { type: 'SOS_ALERT' } });
    expect(after).toBeGreaterThan(before);

    // Appears in own SOS history.
    const history = await request(app).get('/api/citizen/sos').set(auth(token));
    expect(history.status).toBe(200);
    expect(history.body.data.some((s: { id: string }) => s.id === d.id)).toBe(true);
  });

  it('rejects an out-of-coverage location', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app)
      .post('/api/citizen/sos')
      .set(auth(token))
      .send({ latitude: 0.0001, longitude: 0.0001, primaryThreat: 'MEDICAL' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('LOCATION_OUTSIDE_COVERAGE');
  });

  it('rejects an invalid threat enum', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app)
      .post('/api/citizen/sos')
      .set(auth(token))
      .send({ latitude: LAT, longitude: LON, primaryThreat: 'ALIEN_INVASION' });
    expect(res.status).toBe(400);
  });

  it('is CITIZEN-only: government cannot submit or list SOS events', async () => {
    const token = await login('government@climateshield.demo');
    const submit = await request(app)
      .post('/api/citizen/sos')
      .set(auth(token))
      .send({ latitude: LAT, longitude: LON, primaryThreat: 'MEDICAL' });
    expect(submit.status).toBe(403);

    const list = await request(app).get('/api/citizen/sos').set(auth(token));
    expect(list.status).toBe(403);
  });
});
