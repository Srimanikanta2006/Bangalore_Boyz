import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { stateStore } from '../services/stateStore.js';
import { weatherService } from '../services/weatherService.js';
import { SIMULATION_SCENARIOS } from '../data/mockData.js';

const router = Router();

// Health Check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    platform: 'ClimateShield Urban Resilience Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Summary Stats
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = stateStore.getSummaryStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Wards
router.get('/wards', (_req: Request, res: Response) => {
  try {
    const wards = stateStore.getWards();
    res.json(wards);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/wards/:id', (req: Request, res: Response) => {
  const ward = stateStore.getWardById(req.params.id);
  if (!ward) {
    return res.status(404).json({ error: 'Ward not found' });
  }
  res.json(ward);
});

// Assets
router.get('/assets', (req: Request, res: Response) => {
  try {
    const { wardId, type, status } = req.query;
    const assets = stateStore.getAssets({
      wardId: wardId as string | undefined,
      type: type as string | undefined,
      status: status as string | undefined,
    });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/assets/:id', (req: Request, res: Response) => {
  const asset = stateStore.getAssetById(req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  res.json(asset);
});

const AssetSchema = z.object({
  name: z.string().min(2),
  type: z.enum([
    'HOSPITAL',
    'POWER_SUBSTATION',
    'METRO_STATION',
    'STORMWATER_PUMP',
    'WATER_TREATMENT',
    'RESIDENTIAL_SETTLEMENT',
    'INDUSTRIAL_PARK',
    'CRITICAL_ROAD_JUNCTION',
  ]),
  wardId: z.string(),
  wardName: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  elevationM: z.number(),
  drainageCapacityMmHr: z.number().positive(),
  imperviousPct: z.number().min(0).max(100),
  criticality: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  hasBackupPower: z.boolean(),
  basementEquipment: z.boolean(),
  hasDewateringPumps: z.boolean(),
  populationServed: z.number().nonnegative(),
  contactTeam: z.string(),
  emergencyContact: z.string(),
  status: z.enum(['OPERATIONAL', 'AT_RISK', 'DISRUPTED', 'PROTECTED']).default('OPERATIONAL'),
});

router.post('/assets', (req: Request, res: Response) => {
  try {
    const validated = AssetSchema.parse(req.body);
    const created = stateStore.addAsset(validated as any);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Weather
router.get('/weather', (_req: Request, res: Response) => {
  try {
    const reading = weatherService.getCurrentReading();
    res.json({
      reading,
      activeScenarioId: weatherService.getActiveScenarioId(),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/weather/live', async (_req: Request, res: Response) => {
  try {
    const reading = await weatherService.fetchLiveWeather();
    stateStore.recalculateAllRisks();
    res.json({
      message: 'Refreshed live weather from Open-Meteo',
      reading,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/weather/scenario', (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ error: 'scenarioId is required' });
    }
    const reading = weatherService.applyScenario(scenarioId);
    stateStore.recalculateAllRisks();
    res.json({
      message: `Scenario ${scenarioId} applied successfully`,
      reading,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/weather/custom', (req: Request, res: Response) => {
  try {
    const { temperatureC, precipitationRateMmHr, relativeHumidityPct, apparentTempC } = req.body;
    const overrides: any = {};
    if (temperatureC !== undefined) overrides.temperatureC = Number(temperatureC);
    if (precipitationRateMmHr !== undefined) overrides.precipitationRateMmHr = Number(precipitationRateMmHr);
    if (relativeHumidityPct !== undefined) overrides.relativeHumidityPct = Number(relativeHumidityPct);
    if (apparentTempC !== undefined) {
      overrides.apparentTempC = Number(apparentTempC);
    } else if (overrides.temperatureC !== undefined) {
      overrides.apparentTempC = overrides.temperatureC + (overrides.relativeHumidityPct > 60 ? 4 : 1);
    }

    const reading = weatherService.setCustomWeather(overrides);
    stateStore.recalculateAllRisks();
    res.json({
      message: 'Custom weather overrides applied',
      reading,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Simulation Scenarios
router.get('/scenarios', (_req: Request, res: Response) => {
  res.json(SIMULATION_SCENARIOS);
});

// Risk Assessments
router.get('/risks', (_req: Request, res: Response) => {
  try {
    const assessments = stateStore.getRiskAssessments();
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/risks/:assetId', (req: Request, res: Response) => {
  const assessment = stateStore.getRiskAssessmentByAssetId(req.params.assetId);
  if (!assessment) {
    return res.status(404).json({ error: 'Risk assessment not found for asset' });
  }
  res.json(assessment);
});

// Alerts & Incident Actions
router.get('/alerts', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const alerts = stateStore.getAlerts(status as any);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/alerts/:id/status', (req: Request, res: Response) => {
  try {
    const { status, actorName, notes } = req.body;
    if (!['TRIGGERED', 'ACKNOWLEDGED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid alert status' });
    }
    const updated = stateStore.updateAlertStatus(req.params.id, status, actorName, notes);
    if (!updated) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({
      message: `Alert transitioned to ${status}`,
      alert: updated,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
