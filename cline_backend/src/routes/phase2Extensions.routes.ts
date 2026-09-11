import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// In-Memory Phase 2 Stores (Deterministic & Seeded for Hackathon)
const preparednessPlans = [
  {
    id: 'plan_ktm_01',
    planCode: 'FLASH_FLOOD_KATMANDU_BASIN',
    name: 'Kathmandu Bagmati Flash Flood Preparedness Plan',
    description: 'Pre-positions high-capacity pumps at Balkhu Highway Interchange and deploys dam barriers at Kantipath Access Ramp.',
    regionId: 'NEPAL',
    hazardType: 'FLASH_FLOOD',
    severityThreshold: 'HIGH',
    responsibleDepartment: 'FIRE_RESCUE',
    priority: 'CRITICAL',
    triggerConditions: { rainfallRateMmHr: 50, waterDepthMeters: 0.8, riskScore: 70 },
    actions: [
      'Inspect and clear Bagmati Basin Culverts D01-D04',
      'Pre-position Aquatic Rescue Boat Unit 02 at Balkhu Interchange',
      'Issue Citizen Early Warning Broadcast via Cell Broadcast SMS',
      'Deploy Dam Barrier Rigs at Tribhuvan Trauma Center Gate B'
    ],
    requiredUnits: ['Rig-04', 'Boat-02', 'Medic-09'],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'plan_eb_01',
    planCode: 'FLASH_FLOOD_EAST_BASIN',
    name: 'East Basin Inundation Preparedness Plan',
    description: 'Pre-positions water rescue craft and restricts East Basin Arterial Road R24.',
    regionId: 'CHENNAI',
    hazardType: 'FLASH_FLOOD',
    severityThreshold: 'CRITICAL',
    responsibleDepartment: 'PUBLIC_WORKS',
    priority: 'CRITICAL',
    triggerConditions: { rainfallRateMmHr: 40, waterDepthMeters: 0.5, riskScore: 65 },
    actions: [
      'Inspect Bayou Culvert Sump D07',
      'Deploy Sandbag Perimeter at Substation 9',
      'Notify St. Jude Trauma Hub Egress Team',
      'Establish Alternate Egress Route via Highline Elevation Ramp'
    ],
    requiredUnits: ['PW-PUMP-01', 'FIRE-RIG-02'],
    status: 'READY',
    createdAt: new Date().toISOString(),
  }
];

const escalationPolicies = [
  {
    id: 'esc_pol_01',
    name: 'Critical Incident Unresolved SLA Policy',
    severity: 'CRITICAL',
    triggerType: 'TIME_UNRESOLVED',
    thresholdMinutes: 10,
    targetDepartment: 'EMERGENCY_MANAGEMENT',
    notificationType: 'URGENT_SMS_AND_AUDIO',
    enabled: true,
  },
  {
    id: 'esc_pol_02',
    name: 'Hospital Egress Ingress Submersion Policy',
    severity: 'HIGH',
    triggerType: 'ASSET_COMPROMISE',
    thresholdMinutes: 5,
    targetDepartment: 'EMS',
    notificationType: 'EOC_COMMAND_DESK_ALERT',
    enabled: true,
  }
];

const escalationEvents = [
  {
    id: 'esc_evt_101',
    incidentId: 'inc_ktm_01',
    policyId: 'esc_pol_01',
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    target: 'Director of Emergency Management (Kathmandu District)',
    status: 'ESCALATED',
    priorityChangedTo: 'CRITICAL',
  }
];

const recoveryRecords = [
  {
    id: 'rec_ktm_01',
    incidentId: 'INC-KTM-2024-09',
    status: 'RECOVERY_IN_PROGRESS',
    damageAssessment: 'Substation 9 containment berm eroded (+0.8m silt accumulation)',
    affectedAssets: ['Bagmati River Main Bridge', 'Substation 9'],
    restorationActions: ['Dredge culvert sediment', 'Repair asphalt embankment', 'Recalibrate hydro sensors'],
    responsibleDepartment: 'PUBLIC_WORKS',
    assignedUnit: 'PW-HEAVY-CREW-01',
    recoveryCostINR: 1250000,
    startedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    completedAt: null,
    verifiedAt: null,
  }
];

const thresholdConfigs = [
  {
    id: 'thresh_ktm_01',
    regionId: 'NEPAL',
    zoneName: 'Kathmandu Bagmati River Basin',
    rainfallWarningMmHr: 35,
    rainfallCriticalMmHr: 60,
    waterDepthWarningM: 0.4,
    waterDepthCriticalM: 1.2,
    riskWarningScore: 50,
    riskCriticalScore: 75,
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'thresh_eb_01',
    regionId: 'CHENNAI',
    zoneName: 'East Basin Waterfront',
    rainfallWarningMmHr: 40,
    rainfallCriticalMmHr: 65,
    waterDepthWarningM: 0.3,
    waterDepthCriticalM: 0.8,
    riskWarningScore: 45,
    riskCriticalScore: 70,
    enabled: true,
    updatedAt: new Date().toISOString(),
  }
];

const organizations = [
  {
    organizationId: 'org_demo_muni',
    name: 'Kathmandu & Chennai Municipal Disaster Authority',
    plan: 'STATEWIDE_OPERATIONAL',
    status: 'ACTIVE',
    limits: { monitoredAssets: 250, sensors: 500, apiQueries: 500000 },
    usage: { monitoredAssets: 84, sensors: 140, apiQueries: 25000 },
  },
  {
    organizationId: 'org_enterprise_partner',
    name: 'South Asia Infrastructure InsurTech Partner',
    plan: 'ENTERPRISE_INSURTECH',
    status: 'ACTIVE',
    limits: { monitoredAssets: 1000, sensors: 2500, apiQueries: 2000000 },
    usage: { monitoredAssets: 210, sensors: 480, apiQueries: 142000 },
  }
];

// --- 1. PREPAREDNESS PLANS ENDPOINTS ---

router.get('/preparedness-plans', authenticate, (req, res) => {
  return res.json({ success: true, data: { items: preparednessPlans, count: preparednessPlans.length } });
});

router.get('/preparedness-plans/:id', authenticate, (req, res) => {
  const plan = preparednessPlans.find((p) => p.id === req.params.id || p.planCode === req.params.id);
  if (!plan) return res.status(404).json({ success: false, error: { message: 'Preparedness plan not found' } });
  return res.json({ success: true, data: plan });
});

router.post('/preparedness-plans', authenticate, requireRole('ADMIN', 'GOVERNMENT_OPERATOR'), (req, res) => {
  const { name, planCode, hazardType, regionId, actions, responsibleDepartment } = req.body;
  const newPlan = {
    id: `plan_${Date.now()}`,
    planCode: planCode || `PLAN_${Date.now()}`,
    name: name || 'Custom Preparedness Plan',
    description: req.body.description || 'Pre-configured emergency response plan.',
    regionId: regionId || 'NEPAL',
    hazardType: hazardType || 'FLASH_FLOOD',
    severityThreshold: req.body.severityThreshold || 'HIGH',
    responsibleDepartment: responsibleDepartment || 'FIRE_RESCUE',
    priority: req.body.priority || 'HIGH',
    triggerConditions: req.body.triggerConditions || { rainfallRateMmHr: 45, waterDepthMeters: 0.6, riskScore: 65 },
    actions: actions || ['Pre-position emergency crews', 'Broadcast warning alert'],
    requiredUnits: req.body.requiredUnits || ['Rig-04'],
    status: 'READY',
    createdAt: new Date().toISOString(),
  };
  preparednessPlans.push(newPlan);
  return res.status(201).json({ success: true, data: newPlan });
});

router.post('/preparedness-plans/:id/activate', authenticate, requireRole('ADMIN', 'GOVERNMENT_OPERATOR'), (req, res) => {
  const plan = preparednessPlans.find((p) => p.id === req.params.id || p.planCode === req.params.id);
  if (!plan) return res.status(404).json({ success: false, error: { message: 'Preparedness plan not found' } });
  plan.status = 'ACTIVE';
  return res.json({
    success: true,
    data: {
      activatedPlan: plan,
      generatedTask: {
        taskCode: `TASK-PREP-${Date.now()}`,
        status: 'ASSIGNED',
        description: `EXECUTE PREPAREDNESS PLAN: ${plan.name}`,
        assignedDepartment: plan.responsibleDepartment,
        actions: plan.actions,
      }
    }
  });
});

// --- 2. ESCALATION WORKFLOW ENDPOINTS ---

router.get('/escalation-policies', authenticate, (req, res) => {
  return res.json({ success: true, data: { items: escalationPolicies, count: escalationPolicies.length } });
});

router.get('/escalation-events', authenticate, (req, res) => {
  return res.json({ success: true, data: { items: escalationEvents, count: escalationEvents.length } });
});

router.post('/escalations/evaluate', authenticate, requireRole('ADMIN', 'GOVERNMENT_OPERATOR'), (req, res) => {
  const { incidentId, minutesUnresolved, severity } = req.body;
  const policy = escalationPolicies.find((p) => p.enabled && p.severity === severity && minutesUnresolved >= p.thresholdMinutes);
  if (!policy) {
    return res.json({ success: true, data: { escalated: false, message: 'No escalation threshold exceeded.' } });
  }
  const newEvt = {
    id: `esc_evt_${Date.now()}`,
    incidentId: incidentId || 'inc_204',
    policyId: policy.id,
    triggeredAt: new Date().toISOString(),
    target: policy.targetDepartment,
    status: 'ESCALATED',
    priorityChangedTo: 'CRITICAL',
  };
  escalationEvents.push(newEvt);
  return res.status(201).json({ success: true, data: { escalated: true, event: newEvt, policy } });
});

// --- 3. RECOVERY TRACKING ENDPOINTS ---

router.get('/recovery-records', authenticate, (req, res) => {
  return res.json({ success: true, data: { items: recoveryRecords, count: recoveryRecords.length } });
});

router.post('/recovery-records/:id/start', authenticate, requireRole('ADMIN', 'GOVERNMENT_OPERATOR'), (req, res) => {
  const rec = recoveryRecords.find((r) => r.id === req.params.id || r.incidentId === req.params.id);
  if (!rec) return res.status(404).json({ success: false, error: { message: 'Recovery record not found' } });
  rec.status = 'RECOVERY_IN_PROGRESS';
  return res.json({ success: true, data: rec });
});

router.post('/recovery-records/:id/verify', authenticate, requireRole('ADMIN', 'GOVERNMENT_OPERATOR'), (req, res) => {
  const rec = recoveryRecords.find((r) => r.id === req.params.id || r.incidentId === req.params.id);
  if (!rec) return res.status(404).json({ success: false, error: { message: 'Recovery record not found' } });
  rec.status = 'RECOVERY_COMPLETED';
  rec.completedAt = new Date().toISOString();
  rec.verifiedAt = new Date().toISOString();
  return res.json({ success: true, data: rec });
});

// --- 4. THRESHOLD CONFIGURATION ENDPOINTS ---

router.get('/thresholds', authenticate, (req, res) => {
  return res.json({ success: true, data: { items: thresholdConfigs, count: thresholdConfigs.length } });
});

router.put('/thresholds/:id', authenticate, requireRole('ADMIN', 'GOVERNMENT_OPERATOR'), (req, res) => {
  const t = thresholdConfigs.find((tc) => tc.id === req.params.id);
  if (!t) return res.status(404).json({ success: false, error: { message: 'Threshold configuration not found' } });
  
  const { rainfallWarningMmHr, rainfallCriticalMmHr, waterDepthWarningM, waterDepthCriticalM } = req.body;
  if (rainfallWarningMmHr >= rainfallCriticalMmHr || waterDepthWarningM >= waterDepthCriticalM) {
    return res.status(400).json({ success: false, error: { message: 'Invalid threshold range: warning values must be strictly less than critical values.' } });
  }

  Object.assign(t, req.body, { updatedAt: new Date().toISOString() });
  return res.json({ success: true, data: t });
});

// --- 5. MULTI-TENANT ORGANIZATIONS & COMMERCIAL ENDPOINTS ---

router.get('/organizations', authenticate, (req, res) => {
  return res.json({ success: true, data: { items: organizations, count: organizations.length } });
});

router.get('/organizations/:id', authenticate, (req, res) => {
  const org = organizations.find((o) => o.organizationId === req.params.id);
  if (!org) return res.status(404).json({ success: false, error: { message: 'Organization not found' } });
  return res.json({ success: true, data: org });
});

router.post('/commercial/risk-score', (req, res) => {
  const { clientKey, vehicleType, origin, destination } = req.body;
  if (!clientKey || !clientKey.startsWith('cs_live_pk_')) {
    return res.status(401).json({ success: false, error: { message: 'Invalid or missing partner API key' } });
  }
  return res.json({
    success: true,
    data: {
      routeRiskScore: 18.4,
      safetyStatus: 'SAFE_FOR_TRANSIT',
      avoidanceCorridors: ['Kantipath Highline Elevation Ramp'],
      waterInundationMaxMeters: 0.12,
      evaluatedAt: new Date().toISOString(),
    }
  });
});

export default router;
