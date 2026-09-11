import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';

const ready = await dbReady();

// East Basin demo zone centre (has a real boundary polygon in the seed).
const LAT = 13.062;
const LON = 80.275;

describe.skipIf(!ready)('Citizen hazard reporting', () => {
  it('submits a report with a photo, auto-creates a linked NEW incident, and returns it', async () => {
    const token = await login('citizen@climateshield.demo');

    const res = await request(app)
      .post('/api/citizen/reports')
      .set(auth(token))
      .field('category', 'FLASH_FLOOD')
      .field('description', 'Standing water across the north lane, ~14 inches deep.')
      .field('latitude', String(LAT))
      .field('longitude', String(LON))
      .field('reportedSeverity', 'HIGH')
      .attach('evidence', Buffer.from('fake-jpeg-bytes'), { filename: 'flood.jpg', contentType: 'image/jpeg' });

    // 201 = newly created; 200 = deduplicated (same category + same location within 5 min window)
    expect([200, 201]).toContain(res.status);
    const d = res.body.data;
    expect(d.reportCode).toMatch(/^CR-\d{3}$/);
    expect(d.category).toBe('FLASH_FLOOD');
    expect(d.status).toBe('SUBMITTED');
    expect(d.incident).toBeTruthy();
    expect(d.incident.status).toBe('NEW');
    if (res.status === 201) {
      expect(d.evidence).toHaveLength(1);
      expect(d.evidence[0].url).toMatch(/^\/media\/evidence\//);
    }

    // Own report is retrievable by id.
    const detail = await request(app).get(`/api/citizen/reports/${d.id}`).set(auth(token));
    expect(detail.status).toBe(200);
    expect(detail.body.data.reportCode).toBe(d.reportCode);

    // And appears in own history.
    const list = await request(app).get('/api/citizen/reports').set(auth(token));
    expect(list.status).toBe(200);
    expect(list.body.data.some((r: { id: string }) => r.id === d.id)).toBe(true);
  });

  it('rejects a location outside any monitored zone', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app)
      .post('/api/citizen/reports')
      .set(auth(token))
      .field('category', 'OTHER')
      .field('latitude', '0.0001')
      .field('longitude', '0.0001');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('LOCATION_OUTSIDE_COVERAGE');
  });

  it('404s for an unknown/foreign report id (no enumeration)', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app).get('/api/citizen/reports/does-not-exist').set(auth(token));
    expect(res.status).toBe(404);
  });

  it('is CITIZEN-only: government cannot submit or list citizen reports', async () => {
    const token = await login('government@climateshield.demo');
    const submit = await request(app)
      .post('/api/citizen/reports')
      .set(auth(token))
      .field('category', 'OTHER')
      .field('latitude', String(LAT))
      .field('longitude', String(LON));
    expect(submit.status).toBe(403);

    const list = await request(app).get('/api/citizen/reports').set(auth(token));
    expect(list.status).toBe(403);
  });
});
