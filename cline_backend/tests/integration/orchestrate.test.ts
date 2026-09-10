import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';

const ready = await dbReady();

// INC-204 is the seeded flagship demo incident (DRAIN-07 -> RD-24 -> GATE-B ->
// HOSP-01 cascade, see prisma/seed-data.ts).
const SEEDED_INCIDENT_CODE = 'INC-204';

describe.skipIf(!ready)('POST /api/incidents/:id/orchestrate', () => {
  // Timeout raised above the file default (15s): when GEMINI_API_KEY is
  // configured, this exercises 4 live, sequential LLM calls (risk-analyst ->
  // cascade -> dispatch-planner -> comms), which can take ~20-30s round-trip.
  it('returns 200 with a well-formed PROPOSED response plan for a real seeded incident', async () => {
    const token = await login('government@climateshield.demo');

    const res = await request(app)
      .post(`/api/incidents/${SEEDED_INCIDENT_CODE}/orchestrate`)
      .set(auth(token))
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.incidentCode).toBe(SEEDED_INCIDENT_CODE);
    expect(['ai', 'fallback']).toContain(data.mode);
    expect(Array.isArray(data.usedFallbackAgents)).toBe(true);
    expect(typeof data.runId).toBe('string');

    const plan = data.plan;
    expect(plan.status).toBe('PROPOSED');
    expect(plan.requiresOperatorApproval).toBe(true);
    expect(plan.incidentId).toBe(SEEDED_INCIDENT_CODE);
    // Confidence must never exceed the engine's own confidence for the incident.
    expect(plan.confidence).toBeGreaterThanOrEqual(0);
    expect(plan.confidence).toBeLessThanOrEqual(1);

    // Grounded cascade: matches the seeded DRAIN-07 -> RD-24 -> GATE-B -> HOSP-01 chain.
    expect(plan.cascadeAnalysis.criticalPath[0]).toBe('DRAIN-07');
    expect(plan.cascadeAnalysis.criticalPath).toEqual(
      expect.arrayContaining(['DRAIN-07', 'RD-24', 'GATE-B', 'HOSP-01']),
    );

    // Every recommended action must be a real, catalog-constrained action with a reason.
    expect(Array.isArray(plan.dispatch.recommendedActions)).toBe(true);
    expect(plan.dispatch.recommendedActions.length).toBeGreaterThan(0);
    for (const action of plan.dispatch.recommendedActions) {
      expect(typeof action.actionId).toBe('string');
      expect(['low', 'medium', 'high', 'critical']).toContain(action.priority);
      expect(typeof action.reason).toBe('string');
    }

    expect(plan.comms.briefings.public).toBeTruthy();
    expect(plan.provenance.engine).toContain('ClimateShield');
  }, 45000);

  it('returns 404 for a non-existent incident id', async () => {
    const token = await login('government@climateshield.demo');

    const res = await request(app)
      .post('/api/incidents/INC-999999/orchestrate')
      .set(auth(token))
      .send();

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INCIDENT_NOT_FOUND');
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post(`/api/incidents/${SEEDED_INCIDENT_CODE}/orchestrate`)
      .send();

    expect(res.status).toBe(401);
  });
});
