import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';

const ready = await dbReady();

describe.skipIf(!ready)('government screens (infrastructure, zones, map, analytics, hotspots, departments, simulator)', () => {
  let govToken: string;
  let fieldToken: string;

  beforeAll(async () => {
    govToken = await login('government@climateshield.demo');
    fieldToken = await login('field@climateshield.demo');
  });

  // ---------------- Infrastructure screen ----------------

  it('infrastructure list: filters facilities with enriched UI fields', async () => {
    const res = await request(app).get('/api/infrastructure?facilityType=HOSPITAL').set(auth(govToken));
    expect(res.status).toBe(200);
    const items = res.body.data.items;
    expect(items.length).toBeGreaterThanOrEqual(2);
    const stJude = items.find((i: { assetCode: string }) => i.assetCode === 'HOSP-01');
    expect(stJude.name).toBe('St. Jude Regional Medical Center');
    expect(stJude.criticality).toBe('CRITICAL');
    expect(stJude.beds).toBe(340);
    expect(stJude.bedOccupancyPercent).toBe(82);
    expect(stJude.failoverPower).toBe(true);
    expect(stJude.telemetry.occupancy.value).toBe(82);
    expect(stJude.risk.score).toBeGreaterThan(0);
    expect(stJude.telemetryDelayMinutes).not.toBeNull();
  });

  it('infrastructure list: search + vulnerability filters', async () => {
    const search = await request(app).get('/api/infrastructure?search=Substation').set(auth(govToken));
    expect(search.body.data.items.length).toBeGreaterThanOrEqual(2);
    const vuln = await request(app).get('/api/infrastructure?vulnerability=80').set(auth(govToken));
    expect(vuln.body.data.items.every((i: { vulnerability: number }) => i.vulnerability >= 80)).toBe(true);
  });

  it('infrastructure detail (by asset code): telemetry, risk, dependencies, cascade', async () => {
    const res = await request(app).get('/api/infrastructure/DRAIN-07').set(auth(govToken));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.assetCode).toBe('DRAIN-07');
    expect(d.risk.level).toBe('CRITICAL');
    expect(d.cascade.length).toBeGreaterThanOrEqual(4);
    expect(d.upstream.length).toBeGreaterThanOrEqual(1);
    expect(d.downstream.length).toBeGreaterThanOrEqual(1);
    expect(d.hazard.type).toBe('FLASH_FLOOD');
  });

  it('infrastructure telemetry endpoint returns readings', async () => {
    const res = await request(app).get('/api/infrastructure/DRAIN-07/telemetry?limit=10').set(auth(govToken));
    expect(res.status).toBe(200);
    expect(res.body.data.readings.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.latest.water_depth.value).toBeGreaterThan(1);
  });

  it('infrastructure risk endpoint returns assessment + persists snapshot', async () => {
    const res = await request(app).get('/api/infrastructure/HOSP-01/risk').set(auth(govToken));
    expect(res.status).toBe(200);
    expect(res.body.data.assessment.score).toBeGreaterThan(0);
    expect(res.body.data.assessment.factors.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.snapshotId).toBeTruthy();
  });

  it('infrastructure dependencies endpoint exposes the stored graph', async () => {
    const res = await request(app).get('/api/infrastructure/HOSP-01/dependencies').set(auth(govToken));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.upstream.length).toBeGreaterThanOrEqual(3);
    expect(d.downstream.length).toBe(0);
    expect(d.cascadePreview.length).toBe(1);
  });

  it('infrastructure action: assign-team creates an audited task (and completes it)', async () => {
    const res = await request(app).post('/api/infrastructure/PUMP-04/assign-team').set(auth(govToken)).send({ note: 'Rapid response' });
    expect(res.status).toBe(201);
    expect(res.body.data.task.status).toBe('ASSIGNED');
    expect(res.body.data.unit.callsign).toMatch(/^PW-/);
    const code = res.body.data.task.taskCode;
    for (const status of ['ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED']) {
      const r = await request(app).patch(`/api/tasks/${code}/status`).set(auth(govToken)).send({ status });
      expect(r.status).toBe(200);
    }
  });

  it('infrastructure action: maintenance creates a PUBLIC_WORKS task (then cancelled)', async () => {
    const res = await request(app).post('/api/infrastructure/PUMP-02/maintenance').set(auth(govToken)).send({ description: 'Sensor calibration' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toContain('Maintenance');
    const cancel = await request(app).patch(`/api/tasks/${res.body.data.taskCode}/status`).set(auth(govToken)).send({ status: 'CANCELLED' });
    expect(cancel.status).toBe(200);
  });

  it('infrastructure action: reroute issues an audited advisory with alternatives', async () => {
    const res = await request(app).post('/api/infrastructure/BRG-02/reroute').set(auth(govToken)).send({ reason: 'Deck vibration' });
    expect(res.status).toBe(200);
    expect(res.body.data.alternatives.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.advisory).toContain('advisory');
  });

  it('infrastructure action: facility logs expose audit + task history', async () => {
    const res = await request(app).get('/api/infrastructure/PUMP-04/logs').set(auth(govToken));
    expect(res.status).toBe(200);
    expect(res.body.data.auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
  });

  // ---------------- Zones / cascade / response plan ----------------

  it('zones: list + detail', async () => {
    const list = await request(app).get('/api/zones').set(auth(govToken));
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(4);
    expect(list.body.data.items.every((z: { dataQuality: string }) => !!z.dataQuality)).toBe(true);
    const detail = await request(app).get('/api/zones/zone_eb').set(auth(govToken));
    expect(detail.status).toBe(200);
    expect(detail.body.data.zone.name).toBe('East Basin');
    expect(detail.body.data.assets.length).toBe(5);
    expect(detail.body.data.activeHazards.length).toBe(1);
  });

  it('zone cascade: full Zone Detail analysis (risk, factors, impact, cascade vector, actions)', async () => {
    const res = await request(app).get('/api/zones/EB/cascade').set(auth(govToken));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.zone.code).toBe('EB');
    expect(d.riskScore).toBeGreaterThanOrEqual(60);
    expect(d.cascade[0].assetCode).toBe('DRAIN-07');
    expect(d.cascade.map((c: { assetCode: string }) => c.assetCode)).toContain('HOSP-01');
    expect(d.impact.residents).toBeGreaterThan(1000);
    expect(d.impact.blockedRoads).toBeGreaterThanOrEqual(1);
    expect(d.recommendedResponseActions.length).toBeGreaterThanOrEqual(3);
    expect(d.contributingFactors.length).toBeGreaterThanOrEqual(3);
  });

  it('response plan: deterministic and PROPOSED-only (never auto-executed)', async () => {
    const res = await request(app).post('/api/zones/EB/response-plan').set(auth(govToken));
    expect(res.status).toBe(201);
    const d = res.body.data;
    expect(d.status).toBe('PROPOSED');
    expect(d.recommendedUnits.length).toBeGreaterThanOrEqual(1);
    expect(d.recommendedActions.length).toBeGreaterThanOrEqual(3);
    expect(d.note).toContain('PROPOSED');
    expect(d.riskScore).toBeGreaterThan(0);
    expect(d.etaMinutes).toBeGreaterThan(0);
  });

  // ---------------- Simulator ----------------

  it('simulator: runs the spec FLASH_FLOOD scenario deterministically', async () => {
    const res = await request(app).post('/api/simulations').set(auth(govToken)).send({
      scenarioType: 'FLASH_FLOOD',
      rainfallRate: 65,
      stormDuration: 4.5,
      drainageThroughput: 75,
      tidalSurge: 1.8,
      temperature: 28.4,
    });
    expect(res.status).toBe(201);
    const d = res.body.data;
    expect(d.status).toBe('COMPLETED');
    expect(d.results.length).toBeGreaterThanOrEqual(4);
    const eb = d.results.find((r: { zoneName: string }) => r.zoneName === 'East Basin');
    expect(eb.riskScore).toBeGreaterThanOrEqual(60);
    expect(eb.affectedRoads).toBeGreaterThanOrEqual(1);
    expect(d.summary.totalPopulationExposed).toBeGreaterThan(0);
    expect(d.summary.totalDamageUsd).toBeGreaterThan(0);
  });

  it('simulations: list + detail', async () => {
    const list = await request(app).get('/api/simulations').set(auth(govToken));
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);
    const id = list.body.data.items[0].id;
    const detail = await request(app).get(`/api/simulations/${id}`).set(auth(govToken));
    expect(detail.status).toBe(200);
    expect(detail.body.data.results.length).toBeGreaterThan(0);
  });

  // ---------------- Live Map ----------------

  it('map: GeoJSON FeatureCollections for MapLibre', async () => {
    const assets = await request(app).get('/api/map/assets').set(auth(govToken));
    expect(assets.status).toBe(200);
    expect(assets.body.data.type).toBe('FeatureCollection');
    expect(['SYNTHETIC_DEMO', 'MIXED', 'REAL_GEOGRAPHIC']).toContain(assets.body.data.dataQuality);
    expect(assets.body.data.features.length).toBeGreaterThanOrEqual(19);
    expect(assets.body.data.features[0].geometry.coordinates).toHaveLength(2);

    const incidents = await request(app).get('/api/map/incidents').set(auth(govToken));
    expect(incidents.body.data.features.length).toBeGreaterThanOrEqual(8);

    const overlays = await request(app).get('/api/map/overlays').set(auth(govToken));
    expect(overlays.status).toBe(200);
    expect(overlays.body.data.floodZones.features.length).toBeGreaterThanOrEqual(1);
    expect(overlays.body.data.heatZones.features.length).toBe(1);
    expect(overlays.body.data.roadClosures.features.length).toBeGreaterThanOrEqual(2);
    expect(overlays.body.data.drainageTelemetry.features.length).toBeGreaterThanOrEqual(3);
    expect(overlays.body.data.evacuationCorridors.features.length).toBeGreaterThanOrEqual(4);
    expect(overlays.body.data.units.features.length).toBe(11);
  });

  // ---------------- Analytics / hotspots / departments / units / hazards ----------------

  it('analytics: trends, performance, failures, utilization', async () => {
    const res = await request(app).get('/api/analytics/overview').set(auth(govToken));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.incidentTrends).toHaveLength(14);
    expect(d.departmentPerformance.length).toBe(7);
    expect(d.resourceUtilization.totalUnits).toBe(12);
    expect(d.responsePerformance.avgResponseMinutes).not.toBeNull();
    expect(d.hotspotRecurrence.length).toBeGreaterThan(0);
    expect(d.hazardFrequency.historicalByHazardType.length).toBeGreaterThan(0);
  });

  it('hotspots: list + hazard filter', async () => {
    const all = await request(app).get('/api/hotspots').set(auth(govToken));
    expect(all.body.data.items.length).toBe(6);
    const flood = await request(app).get('/api/hotspots?hazardType=FLASH_FLOOD').set(auth(govToken));
    expect(flood.body.data.items.length).toBe(1);
    expect(flood.body.data.items[0].recurrenceScore).toBeGreaterThan(0.5);
  });

  it('departments: list, units, readiness', async () => {
    const list = await request(app).get('/api/departments').set(auth(govToken));
    expect(list.body.data.items.length).toBe(7);
    const readiness = await request(app).get('/api/departments/PW/readiness').set(auth(govToken));
    expect(readiness.status).toBe(200);
    expect(readiness.body.data.fleet.totalUnits).toBe(5);
    expect(['READY', 'HIGH_DEMAND', 'SATURATED']).toContain(readiness.body.data.posture);
    const units = await request(app).get('/api/departments/EMS/units').set(auth(govToken));
    expect(units.body.data.items.length).toBe(2);
  });

  it('units: list + validated unit status transitions', async () => {
    const list = await request(app).get('/api/units').set(auth(govToken));
    expect(list.body.data.items.length).toBe(12);
    const invalid = await request(app).patch('/api/units/unit_barrier_1/status').set(auth(govToken)).send({ status: 'EN_ROUTE' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('hazards: active threat list', async () => {
    const res = await request(app).get('/api/hazards?activeOnly=true').set(auth(govToken));
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(4);
  });

  it('audit: FIELD_OPERATOR cannot read the audit trail (403)', async () => {
    const res = await request(app).get('/api/audit').set(auth(fieldToken));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
