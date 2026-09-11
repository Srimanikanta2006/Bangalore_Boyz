import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, login, auth } from '../helpers.js';

let govToken: string;
let citizenToken: string;

beforeAll(async () => {
  govToken = await login('government@climateshield.demo');
  citizenToken = await login('citizen@climateshield.demo');
});

describe('Phase 2 Extensions Integration Suite', () => {
  // 1. Preparedness Plans
  describe('Preparedness Plans', () => {
    it('GET /api/preparedness-plans returns reusable plans', async () => {
      const res = await request(app).get('/api/preparedness-plans').set(auth(govToken));
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/preparedness-plans/:id returns plan details', async () => {
      const res = await request(app).get('/api/preparedness-plans/plan_ktm_01').set(auth(govToken));
      expect(res.status).toBe(200);
      expect(res.body.data.planCode).toBe('FLASH_FLOOD_KATMANDU_BASIN');
    });

    it('POST /api/preparedness-plans creates a plan', async () => {
      const res = await request(app).post('/api/preparedness-plans').set(auth(govToken)).send({
        name: 'Kathmandu Landslide Plan',
        regionId: 'NEPAL',
        hazardType: 'LANDSLIDE_MUD',
        actions: ['Pre-position excavators'],
      });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Kathmandu Landslide Plan');
    });

    it('POST /api/preparedness-plans/:id/activate activates a plan and generates task', async () => {
      const res = await request(app).post('/api/preparedness-plans/plan_ktm_01/activate').set(auth(govToken));
      expect(res.status).toBe(200);
      expect(res.body.data.activatedPlan.status).toBe('ACTIVE');
      expect(res.body.data.generatedTask.status).toBe('ASSIGNED');
    });
  });

  // 2. Escalation Workflow
  describe('Escalation Workflow', () => {
    it('GET /api/escalation-policies returns policies', async () => {
      const res = await request(app).get('/api/escalation-policies').set(auth(govToken));
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/escalations/evaluate triggers escalation event when threshold exceeded', async () => {
      const res = await request(app).post('/api/escalations/evaluate').set(auth(govToken)).send({
        incidentId: 'inc_ktm_01',
        minutesUnresolved: 15,
        severity: 'CRITICAL',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.escalated).toBe(true);
    });

    it('POST /api/escalations/evaluate does NOT escalate before threshold', async () => {
      const res = await request(app).post('/api/escalations/evaluate').set(auth(govToken)).send({
        incidentId: 'inc_ktm_01',
        minutesUnresolved: 2,
        severity: 'CRITICAL',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.escalated).toBe(false);
    });
  });

  // 3. Recovery Tracking
  describe('Recovery Tracking', () => {
    it('GET /api/recovery-records lists records', async () => {
      const res = await request(app).get('/api/recovery-records').set(auth(govToken));
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/recovery-records/:id/verify completes and verifies recovery', async () => {
      const res = await request(app).post('/api/recovery-records/rec_ktm_01/verify').set(auth(govToken));
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RECOVERY_COMPLETED');
      expect(res.body.data.verifiedAt).toBeTruthy();
    });
  });

  // 4. Configurable Thresholds
  describe('Threshold Configuration', () => {
    it('GET /api/thresholds lists region/zone thresholds', async () => {
      const res = await request(app).get('/api/thresholds').set(auth(govToken));
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('PUT /api/thresholds/:id updates thresholds with validation', async () => {
      const invalid = await request(app).put('/api/thresholds/thresh_ktm_01').set(auth(govToken)).send({
        rainfallWarningMmHr: 70,
        rainfallCriticalMmHr: 50,
      });
      expect(invalid.status).toBe(400);

      const valid = await request(app).put('/api/thresholds/thresh_ktm_01').set(auth(govToken)).send({
        rainfallWarningMmHr: 30,
        rainfallCriticalMmHr: 60,
        waterDepthWarningM: 0.3,
        waterDepthCriticalM: 1.0,
      });
      expect(valid.status).toBe(200);
      expect(valid.body.data.rainfallWarningMmHr).toBe(30);
    });
  });

  // 5. Multi-Tenant Organizations & Partner APIs
  describe('Multi-Tenant Organizations & Commercial Partner APIs', () => {
    it('GET /api/organizations lists multi-tenant organizations', async () => {
      const res = await request(app).get('/api/organizations').set(auth(govToken));
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
    });

    it('POST /api/commercial/risk-score validates partner API key', async () => {
      const invalid = await request(app).post('/api/commercial/risk-score').send({
        clientKey: 'invalid_key',
      });
      expect(invalid.status).toBe(401);

      const valid = await request(app).post('/api/commercial/risk-score').send({
        clientKey: 'cs_live_pk_998240219842109482109482',
        vehicleType: 'HEAVY_LOGISTICS_TRUCK',
      });
      expect(valid.status).toBe(200);
      expect(valid.body.data.safetyStatus).toBe('SAFE_FOR_TRANSIT');
    });
  });
});
