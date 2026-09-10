import fs from 'fs';
import path from 'path';
import {
  Ward,
  Asset,
  WeatherReading,
  AssetRiskAssessment,
  Alert,
} from '../types.js';
import { INITIAL_WARDS, INITIAL_ASSETS } from '../data/mockData.js';
import { weatherService } from './weatherService.js';
import { riskEngine } from './riskEngine.js';
import { sopEngine } from './sopEngine.js';

interface PersistentState {
  wards: Ward[];
  assets: Asset[];
  alerts: Alert[];
  lastSavedAt: string;
}

export class StateStore {
  private wards: Ward[] = [];
  private assets: Asset[] = [];
  private alerts: Alert[] = [];
  private riskAssessments: Map<string, AssetRiskAssessment> = new Map();
  private dataFilePath: string;

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
        console.log(`[StateStore] Loaded state from ${this.dataFilePath} (${this.assets.length} assets, ${this.alerts.length} alerts)`);
      } catch (err) {
        console.warn('[StateStore] Failed to read existing state, seeding defaults:', (err as Error).message);
        this.wards = [...INITIAL_WARDS];
        this.assets = [...INITIAL_ASSETS];
        this.alerts = [];
      }
    } else {
      this.wards = [...INITIAL_WARDS];
      this.assets = [...INITIAL_ASSETS];
      this.alerts = [];
      this.saveToDisk();
    }

    // Run initial risk calculation
    this.recalculateAllRisks();
  }

  private saveToDisk(): void {
    try {
      const state: PersistentState = {
        wards: this.wards,
        assets: this.assets,
        alerts: this.alerts,
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
    if (filters?.wardId) {
      result = result.filter((a) => a.wardId === filters.wardId);
    }
    if (filters?.type) {
      result = result.filter((a) => a.type === filters.type);
    }
    if (filters?.status) {
      result = result.filter((a) => a.status === filters.status);
    }
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
    };
    this.assets.push(newAsset);
    this.saveToDisk();

    // Re-evaluate risk for new asset
    const ward = this.getWardById(newAsset.wardId) || this.wards[0];
    const weather = weatherService.getCurrentReading();
    const assessment = riskEngine.evaluateAssetRisk(newAsset, ward, weather);
    this.riskAssessments.set(newAsset.id, assessment);

    return newAsset;
  }

  public updateAssetStatus(assetId: string, status: Asset['status']): Asset | undefined {
    const asset = this.getAssetById(assetId);
    if (!asset) return undefined;

    asset.status = status;
    this.saveToDisk();
    return asset;
  }

  public recalculateAllRisks(): AssetRiskAssessment[] {
    const weather = weatherService.getCurrentReading();
    const assessments: AssetRiskAssessment[] = [];

    for (const asset of this.assets) {
      const ward = this.getWardById(asset.wardId) || this.wards[0];
      const assessment = riskEngine.evaluateAssetRisk(asset, ward, weather);
      this.riskAssessments.set(asset.id, assessment);
      assessments.push(assessment);

      // Check if this triggers an alert
      const newAlert = sopEngine.generateAlertFromRisk(assessment, asset, weather);
      if (newAlert) {
        // Check deduplication: do we already have an active (non-resolved) alert for this asset?
        const existingActive = this.alerts.find(
          (a) => a.assetId === asset.id && a.status !== 'RESOLVED' && a.hazardType === newAlert.hazardType
        );

        if (!existingActive) {
          this.alerts.unshift(newAlert);
          // Auto update asset status to AT_RISK if score >= 60
          if (assessment.compositeRiskScore >= 60 && asset.status === 'OPERATIONAL') {
            asset.status = 'AT_RISK';
          }
        } else {
          // Update trigger metrics on existing alert
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
    if (newStatus === 'DISPATCHED' && !alert.dispatchedAt) {
      alert.dispatchedAt = new Date().toISOString();
    }
    if (newStatus === 'RESOLVED' && !alert.resolvedAt) {
      alert.resolvedAt = new Date().toISOString();
      // Restore asset to OPERATIONAL if no other critical alerts
      const asset = this.getAssetById(alert.assetId);
      if (asset) {
        asset.status = 'OPERATIONAL';
      }
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

  public getSummaryStats() {
    const weather = weatherService.getCurrentReading();
    const assessments = Array.from(this.riskAssessments.values());
    const totalAssets = this.assets.length;
    const criticalAssets = assessments.filter((a) => a.compositeLevel === 'CRITICAL').length;
    const highRiskAssets = assessments.filter((a) => a.compositeLevel === 'HIGH').length;
    const activeAlerts = this.alerts.filter((a) => a.status !== 'RESOLVED');
    const dispatchedActions = this.alerts.filter((a) => a.status === 'DISPATCHED' || a.status === 'IN_PROGRESS').length;

    // Calculate City Resilience Index (100 - average risk)
    const avgRisk = assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.compositeRiskScore, 0) / assessments.length
      : 20;
    const cityResilienceIndex = Math.max(0, Math.round(100 - avgRisk));

    return {
      cityName: 'Bengaluru Smart City',
      weather,
      cityResilienceIndex,
      totalAssets,
      criticalCount: criticalAssets,
      highRiskCount: highRiskAssets,
      activeAlertsCount: activeAlerts.length,
      dispatchedActionsCount: dispatchedActions,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const stateStore = new StateStore();
