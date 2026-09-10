import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';

const ready = await dbReady();

describe.skipIf(!ready)('critical government journey (end-to-end)', () => {
  let govToken: string;
  let fieldToken: string;
  let taskCode = '';
  let taskId = '';

  beforeAll(async () => {
    govToken = await login('government@climateshield.demo');
    fieldToken = await login('field@climateshield.demo');
  });

  it('health: reports real database connectivity', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeTruthy();
  });

  it('metrics: exposes real Prometheus-format request counters after real traffic', async () => {
    await request(app).get('/api/health');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('climateshield_http_requests_total');
    expect(res.text).toContain('/api/health');
  });

  it('login: returns user + token and never exposes passwordHash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'government@climateshield.demo', password: process.env.DEMO_USER_PASSWORD ?? 'DemoGov@2024' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe('government@climateshield.demo');
    expect(res.body.data.user.role).toBe('GOVERNMENT_OPERATOR');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('GET /api/auth/me returns the session user', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(govToken));
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('government@climateshield.demo');
    expect(res.body.data.user.departmentName).toBe('Emergency Management');
  });

  it('overview: computes municipal metrics from the database', async () => {
    const res = await request(app).get('/api/government/overview').set(auth(govToken));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.dataQuality).toBe('SYNTHETIC_DEMO');
    expect(d.resilienceIndex).toBeGreaterThanOrEqual(0);
    expect(d.resilienceIndex).toBeLessThanOrEqual(100);
    expect(['STRONG', 'GUARDED', 'MODERATE_CAUTION', 'CRITICAL_ALERT']).toContain(d.resilienceLevel);
    expect(d.activeThreats).toBe(4);
    expect(d.monitoredZones).toBeGreaterThanOrEqual(4);
    expect(d.activeIncidents).toBeGreaterThanOrEqual(8);
    expect(d.criticalIncidents).toBeGreaterThanOrEqual(2);
    expect(d.criticalInfrastructure.total).toBeGreaterThanOrEqual(3);
    expect(d.precipitation.value).toBeGreaterThanOrEqual(42);
    expect(d.heat.value).toBeGreaterThanOrEqual(40);
    expect(d.mobility.index).toBeGreaterThan(0);
    expect(d.resourceReadiness.percent).toBeGreaterThan(0);
    expect(d.recentCriticalIncidents.length).toBeGreaterThan(0);
    expect(d.activeHazards.length).toBe(4);
  });

  it('response center: returns dispatch board aggregates', async () => {
    const res = await request(app).get('/api/response-center').set(auth(govToken));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.summary.activeIncidents).toBeGreaterThanOrEqual(8);
    expect(d.severityGroups.CRITICAL.length).toBeGreaterThanOrEqual(2);
    expect(d.summary.unassignedIncidents).toBeGreaterThanOrEqual(1);
    expect(d.availableUnits.length).toBeGreaterThan(0);
    expect(d.telemetry.rainfallMmPerHour).toBeGreaterThan(0);
    expect(d.hotspots.length).toBeGreaterThan(0);
    expect(d.summary.targetResolutionHours.CRITICAL).toBe(2);
  });

  it('incidents: filters by severity with pagination', async () => {
    const res = await request(app).get('/api/incidents?severity=CRITICAL&page=1&limit=20').set(auth(govToken));
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.items.every((i: { severity: string }) => i.severity === 'CRITICAL')).toBe(true);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
  });

  it('incident detail: opens INC-204 with cascade + available units', async () => {
    const res = await request(app).get('/api/incidents/INC-204').set(auth(govToken));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.incident.incidentCode).toBe('INC-204');
    expect(d.incident.title).toContain('Flash Inundation');
    expect(d.incident.severity).toBe('CRITICAL');
    expect(d.incident.zone.name).toBe('East Basin');
    expect(d.incident.primaryAsset.assetCode).toBe('DRAIN-07');
    expect(d.incident.slaMinutesRemaining).not.toBeNull();
    expect(d.cascade.nodes.length).toBeGreaterThanOrEqual(3);
    expect(d.cascade.nodes.map((n: { assetCode: string }) => n.assetCode)).toContain('HOSP-01');
    expect(d.availableUnits.length).toBeGreaterThan(0);
  });

  it('dispatch: creates TASK, assigns unit, records history + audit atomically', async () => {
    const res = await request(app).post('/api/incidents/INC-204/dispatch').set(auth(govToken)).send({ unitId: 'unit_pump_1' });
    expect(res.status).toBe(201);
    const d = res.body.data;
    expect(d.task.status).toBe('ASSIGNED');
    expect(d.task.unitCallsign).toBe('PW-DRAIN-A1');
    expect(d.task.priority).toBe('CRITICAL');
    expect(d.unit.status).toBe('ASSIGNED');
    expect(d.incident.status).toBe('ACKNOWLEDGED'); // first dispatch acknowledges a NEW incident
    taskCode = d.task.taskCode;
    taskId = d.task.id;
    expect(taskCode).toMatch(/^TASK-\d+$/);
  });

  it('dispatch: duplicate dispatch returns 409 DUPLICATE_DISPATCH', async () => {
    const res = await request(app).post('/api/incidents/INC-204/dispatch').set(auth(govToken)).send({ unitId: 'unit_pump_1' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_DISPATCH');
  });

  it('dispatch: unavailable unit returns 409 UNIT_NOT_AVAILABLE', async () => {
    const res = await request(app).post('/api/incidents/INC-204/dispatch').set(auth(govToken)).send({ unitId: 'unit_pump_9' }); // OFFLINE
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('UNIT_NOT_AVAILABLE');
  });

  it('tasks: the dispatched task appears as ASSIGNED with history', async () => {
    const res = await request(app).get(`/api/tasks/${taskCode}`).set(auth(govToken));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ASSIGNED');
    expect(res.body.data.assignedUnit.callsign).toBe('PW-DRAIN-A1');
    expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
  });

  it('task lifecycle: rejects invalid transition ASSIGNED -> COMPLETED', async () => {
    const res = await request(app).patch(`/api/tasks/${taskCode}/status`).set(auth(fieldToken)).send({ status: 'COMPLETED' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('task lifecycle: field operator acknowledges, starts, completes', async () => {
    const ack = await request(app).patch(`/api/tasks/${taskCode}/status`).set(auth(fieldToken)).send({ status: 'ACKNOWLEDGED', note: 'Crew rolling' });
    expect(ack.status).toBe(200);
    expect(ack.body.data.acknowledgedAt).toBeTruthy();

    const start = await request(app).patch(`/api/tasks/${taskCode}/status`).set(auth(fieldToken)).send({ status: 'IN_PROGRESS' });
    expect(start.status).toBe(200);
    expect(start.body.data.startedAt).toBeTruthy();

    const done = await request(app).patch(`/api/tasks/${taskCode}/status`).set(auth(fieldToken)).send({ status: 'COMPLETED', note: 'Drain cleared' });
    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('COMPLETED');
    expect(done.body.data.completedAt).toBeTruthy();
  });

  it('task lifecycle: completing the task releases the unit to AVAILABLE', async () => {
    const res = await request(app).get('/api/units/unit_pump_1').set(auth(govToken));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('AVAILABLE');
  });

  it('task verify: government verifies the completed task', async () => {
    const res = await request(app).post(`/api/tasks/${taskCode}/verify`).set(auth(govToken)).send({ note: 'Verified from command center' });
    expect(res.status).toBe(200);
    expect(res.body.data.verifiedAt).toBeTruthy();
  });

  it('task verify: double verification returns 409', async () => {
    const res = await request(app).post(`/api/tasks/${taskCode}/verify`).set(auth(govToken)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('TASK_ALREADY_VERIFIED');
  });

  it('task history: records the complete operational chain', async () => {
    const res = await request(app).get(`/api/tasks/${taskCode}/history`).set(auth(govToken));
    expect(res.status).toBe(200);
    const statuses = res.body.data.history.map((h: { toStatus: string }) => h.toStatus);
    expect(statuses).toEqual(['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED']);
  });

  it('audit: the operational chain is auditable end-to-end', async () => {
    const res = await request(app).get(`/api/audit?entityType=TASK&entityId=${taskId}`).set(auth(govToken));
    expect(res.status).toBe(200);
    const actions = res.body.data.items.map((a: { action: string }) => a.action);
    expect(actions).toContain('TASK_CREATED');
    expect(actions).toContain('TASK_ACKNOWLEDGED');
    expect(actions).toContain('TASK_STARTED');
    expect(actions).toContain('TASK_COMPLETED');
    expect(actions).toContain('TASK_VERIFIED');
  });

  it('rejects unauthenticated access with 401', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects invalid tokens with 401', async () => {
    const res = await request(app).get('/api/incidents').set({ Authorization: 'Bearer not-a-jwt' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects wrong credentials with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'government@climateshield.demo', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('blocks FIELD_OPERATOR from dispatching (403 FORBIDDEN)', async () => {
    const res = await request(app).post('/api/incidents/INC-201/dispatch').set(auth(fieldToken)).send({ unitId: 'unit_fire_3' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 with entity-specific codes for unknown ids', async () => {
    const res = await request(app).get('/api/incidents/INC-999').set(auth(govToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INCIDENT_NOT_FOUND');
  });

  it('validates request bodies with Zod (400 VALIDATION_ERROR)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid incident status transition with 422', async () => {
    const res = await request(app).patch('/api/incidents/INC-201/status').set(auth(govToken)).send({ status: 'RESOLVED' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});
