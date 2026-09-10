import fs from 'fs';
import path from 'path';
import {
  Ward,
  Asset,
  WeatherReading,
  AssetRiskAssessment,
  Alert,
  Incident,
  ResponseTask,
  HistoricalRepeatLocation,
} from '../types.js';
import {
  INITIAL_WARDS,
  INITIAL_ASSETS,
  INITIAL_INCIDENTS,
  HISTORICAL_REPEAT_LOCATIONS,
} from '../data/mockData.js';
import { weatherService } from './weatherService.js';
import { riskEngine } from './riskEngine.js';
import { sopEngine } from './sopEngine.js';

interface PersistentState {
  wards: Ward[];
  assets: Asset[];
  alerts: Alert[];
  incidents: Incident[];
  lastSavedAt: string;
}

export class StateStore {
  private wards: Ward[] = [];
  private assets: Asset[] = [];
  private alerts: Alert[] = [];
  private incidents: Incident[] = [];
  private history: HistoricalRepeatLocation[] = [...HISTORICAL_REPEAT_LOCATIONS];
  private riskAssessments: Map<string, AssetRiskAssessment> = new Map();
  private dataFilePath: string;
  private isSimulatingStaleData: boolean = false;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dataFilePath = path.join(dataDir, 'state.json');

    this.initialize();
  }

  private initialize(): void {
    if (fs.existsSync(this.dataFilePath)) {
      try {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed: PersistentState = JSON.parse(raw);
        this.wards = parsed.wards || INITIAL_WARDS;
        this.assets = parsed.assets || INITIAL_ASSETS;
        this.alerts = parsed.alerts || [];
        this.incidents = parsed.incidents || INITIAL_INCIDENTS;
      } catch (err) {
        this.wards = [...INITIAL_WARDS];
        this.assets = [...INITIAL_ASSETS];
        this.alerts = [];
        this.incidents = [...INITIAL_INCIDENTS];
      }
    } else {
      this.wards = [...INITIAL_WARDS];
      this.assets = [...INITIAL_ASSETS];
      this.alerts = [];
      this.incidents = [...INITIAL_INCIDENTS];
      this.saveToDisk();
    }

    // Initial risk calculation
    this.recalculateAllRisks();
  }

  private saveToDisk(): void {
    try {
      const state: PersistentState = {
        wards: this.wards,
        assets: this.assets,
        alerts: this.alerts,
        incidents: this.incidents,
        lastSavedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StateStore] Failed to save state to disk:', err);
    }
  }

  public getWards(): Ward[] {
    return this.wards.map((ward) => {
      const wardAssets = this.assets.filter((a) => a.wardId === ward.id);
      return {
        ...ward,
        criticalAssetsCount: wardAssets.length,
      };
    });
  }

  public getWardById(id: string): Ward | undefined {
    return this.wards.find((w) => w.id === id);
  }

  public getAssets(filters?: { wardId?: string; type?: string; status?: string }): Asset[] {
    let result = [...this.assets];
    if (filters?.wardId) result = result.filter((a) => a.wardId === filters.wardId);
    if (filters?.type) result = result.filter((a) => a.type === filters.type);
    if (filters?.status) result = result.filter((a) => a.status === filters.status);
    return result;
  }

  public getAssetById(id: string): Asset | undefined {
    return this.assets.find((a) => a.id === id);
  }

  public addAsset(assetData: Omit<Asset, 'id'>): Asset {
    const id = `asset-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newAsset: Asset = {
      ...assetData,
      id,
      historicalIncidentCount: 0,
      drainageQuality: assetData.drainageQuality || 'Moderate',
    };
    this.assets.push(newAsset);
    this.saveToDisk();

    const ward = this.getWardById(newAsset.wardId) || this.wards[0];
    const weather = weatherService.getCurrentReading();
    const assessment = riskEngine.evaluateAssetRisk(newAsset, ward, weather);
    this.riskAssessments.set(newAsset.id, assessment);

    return newAsset;
  }

  public recalculateAllRisks(): AssetRiskAssessment[] {
    const weather = weatherService.getCurrentReading();
    const assessments: AssetRiskAssessment[] = [];

    // Check confidence based on stale simulation
    const confidence = this.isSimulatingStaleData ? 'LOW' : 'HIGH';

    for (const asset of this.assets) {
      const ward = this.getWardById(asset.wardId) || this.wards[0];
      const assessment = riskEngine.evaluateAssetRisk(asset, ward, weather);
      assessment.confidence = confidence;
      assessment.floodRisk.confidence = confidence;
      assessment.heatRisk.confidence = confidence;

      this.riskAssessments.set(asset.id, assessment);
      assessments.push(assessment);

      // Check alert trigger
      const newAlert = sopEngine.generateAlertFromRisk(assessment, asset, weather);
      if (newAlert) {
        const existingActive = this.alerts.find(
          (a) => a.assetId === asset.id && a.status !== 'RESOLVED' && a.hazardType === newAlert.hazardType
        );

        if (!existingActive) {
          this.alerts.unshift(newAlert);
          if (assessment.compositeRiskScore >= 60 && asset.status === 'OPERATIONAL') {
            asset.status = 'AT_RISK';
          }
        } else {
          existingActive.triggerMetrics = newAlert.triggerMetrics;
          existingActive.severity = newAlert.severity;
        }
      }
    }

    this.saveToDisk();
    return assessments;
  }

  public getRiskAssessments(): AssetRiskAssessment[] {
    return Array.from(this.riskAssessments.values());
  }

  public getRiskAssessmentByAssetId(assetId: string): AssetRiskAssessment | undefined {
    return this.riskAssessments.get(assetId);
  }

  // Alerts
  public getAlerts(status?: Alert['status']): Alert[] {
    if (status) {
      return this.alerts.filter((a) => a.status === status);
    }
    return this.alerts;
  }

  public getAlertById(alertId: string): Alert | undefined {
    return this.alerts.find((a) => a.id === alertId);
  }

  public updateAlertStatus(
    alertId: string,
    newStatus: Alert['status'],
    actorName: string = 'Operations Dispatcher',
    notes?: string
  ): Alert | undefined {
    const alert = this.getAlertById(alertId);
    if (!alert) return undefined;

    alert.status = newStatus;
    if (newStatus === 'RESOLVED') {
      alert.resolvedAt = new Date().toISOString();
      const asset = this.getAssetById(alert.assetId);
      if (asset) asset.status = 'OPERATIONAL';
    }

    alert.actionHistory.push({
      timestamp: new Date().toISOString(),
      action: `STATUS_CHANGED_TO_${newStatus}`,
      actor: actorName,
      notes: notes || `Operational status transitioned to ${newStatus}`,
    });

    this.saveToDisk();
    return alert;
  }

  // Incidents
  public getIncidents(status?: Incident['status']): Incident[] {
    if (status) {
      return this.incidents.filter((i) => i.status === status);
    }
    return this.incidents;
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((i) => i.id === id);
  }

  public createIncidentFromPlan(data: {
    assetId: string;
    hazardType: 'FLOOD' | 'HEAT' | 'COMPOUND';
    title: string;
    assignedTeam: string;
    leadResponder: string;
    notes?: string;
    taskTitles: string[];
  }): Incident {
    const asset = this.getAssetById(data.assetId);
    const risk = this.getRiskAssessmentByAssetId(data.assetId);
    const incidentNumber = 100 + this.incidents.length + 1;
    const incidentId = `inc-${incidentNumber}`;

    const tasks: ResponseTask[] = data.taskTitles.map((title, idx) => ({
      id: `task-${incidentNumber}-${idx + 1}`,
      incidentId,
      title,
      assignedTeam: data.assignedTeam,
      assignedPerson: idx === 0 ? data.leadResponder : `${data.assignedTeam} Field Unit`,
      priority: idx === 0 ? 'CRITICAL' : idx === 1 ? 'HIGH' : 'MEDIUM',
      dueTime: new Date(Date.now() + (idx + 1) * 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING',
      escalationLevel: 0,
    }));

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newIncident: Incident = {
      id: incidentId,
      incidentNumber,
      hazardType: data.hazardType,
      title: data.title || `${data.hazardType} Incident — ${asset?.name || 'Asset'}`,
      assetId: data.assetId,
      assetName: asset?.name || 'Critical Facility',
      wardId: asset?.wardId || 'ward-151',
      wardName: asset?.wardName || 'Koramangala',
      severity: risk && risk.compositeRiskScore >= 80 ? 'CRITICAL' : 'HIGH',
      status: 'RESPONDING',
      assignedTeam: data.assignedTeam,
      leadResponder: data.leadResponder,
      createdAt: now.toISOString(),
      notes: data.notes || 'Incident initialized from operational response plan.',
      tasks,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          time: timeStr,
          title: 'Risk Calculated',
          description: `Risk score assessed at ${risk?.compositeRiskScore || 85}/100.`,
          actor: 'Risk Engine',
          type: 'RISK_CALCULATED',
        },
        {
          id: `tl-${Date.now()}-2`,
          time: timeStr,
          title: 'Incident Declared',
          description: `Response plan confirmed. ${tasks.length} tactical tasks dispatched to ${data.assignedTeam}.`,
          actor: data.leadResponder,
          type: 'INCIDENT_ACKNOWLEDGED',
        },
      ],
    };

    this.incidents.unshift(newIncident);

    // If there is an active alert for this asset, link and mark as acknowledged
    const matchingAlert = this.alerts.find((a) => a.assetId === data.assetId && a.status !== 'RESOLVED');
    if (matchingAlert) {
      matchingAlert.incidentId = incidentId;
      matchingAlert.status = 'ACKNOWLEDGED';
      matchingAlert.actionHistory.push({
        timestamp: now.toISOString(),
        action: 'RESPONSE_PLAN_CREATED',
        actor: data.leadResponder,
        notes: `Converted to Incident #${incidentNumber}`,
      });
    }

    if (asset) {
      asset.status = 'AT_RISK';
    }

    this.saveToDisk();
    return newIncident;
  }

  public updateTaskStatus(
    taskId: string,
    newStatus: ResponseTask['status'],
    notes?: string
  ): { task: ResponseTask; incident: Incident } | undefined {
    for (const inc of this.incidents) {
      const task = inc.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = newStatus;
        if (newStatus === 'COMPLETED') {
          task.completedAt = new Date().toISOString();
        }
        if (notes) task.notes = notes;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        inc.timeline.push({
          id: `tl-${Date.now()}`,
          time: timeStr,
          title: newStatus === 'COMPLETED' ? 'Task Completed' : `Task Status: ${newStatus}`,
          description: `${task.title} updated to ${newStatus}.`,
          actor: task.assignedPerson,
          type: newStatus === 'COMPLETED' ? 'TASK_COMPLETED' : 'ACTION_TAKEN',
        });

        // If all tasks are completed, advance incident status
        const allCompleted = inc.tasks.every((t) => t.status === 'COMPLETED');
        if (allCompleted && inc.status !== 'RESOLVED') {
          inc.status = 'RESOLVED';
          inc.resolvedAt = new Date().toISOString();
          inc.timeline.push({
            id: `tl-${Date.now()}-res`,
            time: timeStr,
            title: 'Incident Resolved',
            description: 'All tactical response tasks successfully executed and verified.',
            actor: inc.leadResponder,
            type: 'RESOLVED',
          });
        }

        this.saveToDisk();
        return { task, incident: inc };
      }
    }
    return undefined;
  }

  public escalateTask(taskId: string, actor: string = 'Supervisor'): ResponseTask | undefined {
    for (const inc of this.incidents) {
      const task = inc.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = 'ESCALATED';
        task.escalationLevel = ((task.escalationLevel + 1) % 3) as 0 | 1 | 2;
        task.escalatedAt = new Date().toISOString();

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        inc.timeline.push({
          id: `tl-${Date.now()}`,
          time: timeStr,
          title: 'Task Escalated',
          description: `${task.title} overdue/unacknowledged. Escalated to tier ${task.escalationLevel}. Supervisor notified.`,
          actor,
          type: 'ESCALATED',
        });

        this.saveToDisk();
        return task;
      }
    }
    return undefined;
  }

  public getHistoricalRepeatLocations(): HistoricalRepeatLocation[] {
    return this.history;
  }

  // Data Quality controls
  public toggleStaleSimulation(): boolean {
    this.isSimulatingStaleData = !this.isSimulatingStaleData;
    this.recalculateAllRisks();
    return this.isSimulatingStaleData;
  }

  public getDataQualityStatus() {
    const weather = weatherService.getCurrentReading();
    if (this.isSimulatingStaleData) {
      return {
        status: 'STALE' as const,
        lastUpdatedMinutesAgo: 28,
        confidenceLevel: 'LOW' as const,
        message: 'Weather data is STALE (last updated 28m ago). Risk confidence reduced because current environmental telemetry is unavailable.',
        isSimulated: true,
      };
    }
    return {
      status: 'GOOD' as const,
      lastUpdatedMinutesAgo: 2,
      confidenceLevel: 'HIGH' as const,
      message: 'Weather telemetry feed is ACTIVE & SYNCHRONIZED via Open-Meteo.',
      isSimulated: false,
    };
  }

  public getSummaryStats() {
    const weather = weatherService.getCurrentReading();
    const assessments = Array.from(this.riskAssessments.values());
    const totalAssets = this.assets.length;
    const criticalRisks = assessments.filter((a) => a.compositeLevel === 'CRITICAL').length;
    const highRiskAssets = assessments.filter((a) => a.compositeLevel === 'HIGH').length;
    const activeIncidents = this.incidents.filter((i) => i.status === 'RESPONDING' || i.status === 'DETECTED').length;

    // Collect pending tasks across all active incidents
    let pendingTasks = 0;
    for (const inc of this.incidents) {
      if (inc.status !== 'RESOLVED' && inc.status !== 'CLOSED') {
        pendingTasks += inc.tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED').length;
      }
    }

    const activeAlerts = this.alerts.filter((a) => a.status !== 'RESOLVED').length;

    return {
      criticalRisks,
      highRiskAssets,
      activeIncidents,
      pendingTasks,
      totalAssets,
      activeAlerts,
      weather: {
        ...weather,
        dataQuality: this.isSimulatingStaleData ? 'STALE' : 'GOOD',
        lastUpdatedMinutesAgo: this.isSimulatingStaleData ? 28 : 2,
      },
      dataQuality: this.getDataQualityStatus(),
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const stateStore = new StateStore();
