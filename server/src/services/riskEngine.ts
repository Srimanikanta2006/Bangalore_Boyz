import {
  Asset,
  Ward,
  WeatherReading,
  AssetRiskAssessment,
  FloodRiskAssessment,
  HeatRiskAssessment,
  RiskFactorWeights,
} from '../types.js';

export class RiskEngine {
  /**
   * Calculate pluvial flood risk for a specific asset given ward characteristics and weather
   */
  public calculateFloodRisk(
    asset: Asset,
    ward: Ward,
    weather: WeatherReading
  ): FloodRiskAssessment {
    const rainMmHr = weather.precipitationRateMmHr;
    const rain24h = weather.precipitationAccumulation24hMm;
    const soilSat = weather.soilMoisturePct;

    // 1. Hazard Score (0 - 100): Rain intensity & ground saturation
    const rainIntensityFactor = Math.min(100, (rainMmHr / 60) * 80);
    const accumulationFactor = Math.min(100, (rain24h / 100) * 50);
    const soilFactor = (soilSat / 100) * 30;
    const hazardScore = Math.min(
      100,
      rainIntensityFactor * 0.6 + accumulationFactor * 0.25 + soilFactor * 0.15
    );

    // 2. Exposure Score (0 - 100): Elevation deficit & impervious runoff
    // Baseline plateau reference = 920m. Lower elevations pool water faster.
    const elevationDeficitM = Math.max(0, 920 - asset.elevationM);
    const topoExposure = Math.min(100, (elevationDeficitM / 42) * 100);
    const imperviousExposure = (asset.imperviousPct / 100) * 100;
    const exposureScore = topoExposure * 0.6 + imperviousExposure * 0.4;

    // 3. Vulnerability Score (0 - 100): Drainage deficit & physical susceptibility
    // Effective runoff generated: Q = Rain * (Impervious / 100) * RunoffCoeff
    const effectiveRunoff = rainMmHr * (asset.imperviousPct / 100) * (soilSat > 70 ? 1.2 : 0.9);
    const effectiveCapacity = Math.min(asset.drainageCapacityMmHr, ward.drainageCapacityMmHr);
    const drainDeficit = Math.max(0, effectiveRunoff - effectiveCapacity);
    const drainDeficitScore = Math.min(100, (drainDeficit / 30) * 100);

    let physicalVuln = 20;
    if (asset.basementEquipment) physicalVuln += 35;
    if (!asset.hasBackupPower) physicalVuln += 25;
    if (asset.criticality >= 4) physicalVuln += 20;
    physicalVuln = Math.min(100, physicalVuln);

    const vulnerabilityScore = drainDeficitScore * 0.65 + physicalVuln * 0.35;

    // 4. Resilience Mitigation (0 - 100)
    let resilienceScore = 15;
    if (asset.hasDewateringPumps) resilienceScore += 45;
    if (asset.drainageCapacityMmHr > 40) resilienceScore += 25;
    if (asset.hasBackupPower) resilienceScore += 15;
    resilienceScore = Math.min(100, resilienceScore);

    // Composite Flood Risk Formula:
    // Raw = (Hazard * 0.40) + (Exposure * 0.30) + (Vulnerability * 0.30) - (Resilience * 0.15)
    let rawScore =
      hazardScore * 0.42 +
      exposureScore * 0.28 +
      vulnerabilityScore * 0.30 -
      resilienceScore * 0.14;

    // If there is zero rain, flood risk drops to baseline
    if (rainMmHr === 0 && rain24h < 5) {
      rawScore = Math.min(12, rawScore * 0.15);
    }

    const finalScore = Math.round(Math.max(0, Math.min(100, rawScore)));

    // Project inundation depth in cm
    let projectedInundationDepthCm = 0;
    if (finalScore >= 35) {
      projectedInundationDepthCm = Math.round(
        (finalScore / 100) * (drainDeficit > 0 ? drainDeficit * 1.5 : 12) +
          (topoExposure / 100) * 8
      );
    }

    let level: FloodRiskAssessment['level'] = 'LOW';
    if (finalScore >= 80) level = 'CRITICAL';
    else if (finalScore >= 60) level = 'HIGH';
    else if (finalScore >= 35) level = 'MODERATE';

    const factors: RiskFactorWeights = {
      hazardContribution: Math.round(hazardScore),
      exposureContribution: Math.round(exposureScore),
      vulnerabilityContribution: Math.round(vulnerabilityScore),
      resilienceMitigation: Math.round(resilienceScore),
    };

    let explanation = `Normal hydrological balance. Drain capacity (${effectiveCapacity} mm/hr) sufficient.`;
    if (level === 'CRITICAL') {
      explanation = `CRITICAL PLUVIAL SURGE: Rainfall (${rainMmHr} mm/hr) severely exceeds drain threshold (${effectiveCapacity} mm/hr). Inundation depth ~${projectedInundationDepthCm}cm at low-elevation contour (${asset.elevationM}m). High threat to ${asset.basementEquipment ? 'basement installations' : 'surface operations'}.`;
    } else if (level === 'HIGH') {
      explanation = `HIGH FLOOD RISK: Significant drainage deficit (${drainDeficit.toFixed(1)} mm/hr). Runoff accumulation imminent at ${asset.wardName}. Immediate pump mobilization advised.`;
    } else if (level === 'MODERATE') {
      explanation = `MODERATE RISK: Minor surface ponding likely. Monitor drain intake grids for debris blockage.`;
    }

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
      weather.isStale || weather.dataQuality === 'STALE'
        ? 'LOW'
        : weather.dataQuality === 'DEGRADED'
        ? 'MEDIUM'
        : 'HIGH';

    return {
      score: finalScore,
      level,
      projectedInundationDepthCm,
      drainageDeficitMmHr: Number(drainDeficit.toFixed(1)),
      factors,
      explanation,
      confidence,
    };
  }

  /**
   * Calculate urban heat island and heat stress risk
   */
  public calculateHeatRisk(
    asset: Asset,
    ward: Ward,
    weather: WeatherReading
  ): HeatRiskAssessment {
    const ambientTemp = weather.temperatureC;
    const apparentTemp = weather.apparentTempC;
    const humidity = weather.relativeHumidityPct;

    // 1. Thermal Hazard Score (0 - 100): Steadman Apparent Temp & WBGT
    // Wet Bulb Globe Temp approximation: WBGT ~ 0.567 * T + 0.393 * e + 3.94
    // simplified for urban screening
    const vaporPressure = (humidity / 100) * 6.105 * Math.exp((17.27 * ambientTemp) / (237.7 + ambientTemp));
    const wbgtEstimate = 0.567 * ambientTemp + 0.393 * vaporPressure + 3.94;

    let hazardScore = 0;
    if (apparentTemp >= 46) hazardScore = 95;
    else if (apparentTemp >= 41) hazardScore = 75 + ((apparentTemp - 41) / 5) * 20;
    else if (apparentTemp >= 35) hazardScore = 45 + ((apparentTemp - 35) / 6) * 30;
    else if (apparentTemp >= 30) hazardScore = 20 + ((apparentTemp - 30) / 5) * 25;
    else hazardScore = 10;
    hazardScore = Math.min(100, hazardScore);

    // 2. Exposure Score (0 - 100): Urban heat island trapping
    // High impervious surface & low canopy traps thermal radiation
    const uhiExcess = (ward.imperviousSurfacePct / 100) * 60 + ((100 - ward.treeCanopyPct) / 100) * 40;
    const exposureScore = Math.min(100, uhiExcess);

    // 3. Vulnerability Score (0 - 100): Population density & critical infrastructure strain
    let vulnScore = (asset.criticality / 5) * 40;
    if (asset.type === 'HOSPITAL') vulnScore += 35; // vulnerable patients, cooling loads
    if (asset.type === 'METRO_STATION') vulnScore += 30; // heavy commuter crowds
    if (asset.type === 'RESIDENTIAL_SETTLEMENT') vulnScore += 30; // high density, tin roofs, poor insulation
    if (asset.type === 'POWER_SUBSTATION') vulnScore += 25; // transformer thermal derating & peak AC load
    vulnScore = Math.min(100, vulnScore);

    // 4. Resilience Mitigation (0 - 100)
    let resilienceScore = 20;
    if (asset.hasBackupPower) resilienceScore += 30;
    if (ward.treeCanopyPct > 15) resilienceScore += 25;
    resilienceScore = Math.min(100, resilienceScore);

    // Composite Heat Score Formula
    let rawScore =
      hazardScore * 0.45 +
      exposureScore * 0.25 +
      vulnScore * 0.30 -
      resilienceScore * 0.12;

    const finalScore = Math.round(Math.max(0, Math.min(100, rawScore)));

    let level: HeatRiskAssessment['level'] = 'LOW';
    if (finalScore >= 78 || apparentTemp >= 44) level = 'EMERGENCY';
    else if (finalScore >= 60 || apparentTemp >= 39) level = 'WARNING';
    else if (finalScore >= 38 || apparentTemp >= 33) level = 'ADVISORY';

    const factors: RiskFactorWeights = {
      hazardContribution: Math.round(hazardScore),
      exposureContribution: Math.round(exposureScore),
      vulnerabilityContribution: Math.round(vulnScore),
      resilienceMitigation: Math.round(resilienceScore),
    };

    let explanation = `Thermal conditions nominal (${ambientTemp}°C, Apparent ${apparentTemp}°C).`;
    if (level === 'EMERGENCY') {
      explanation = `HEAT EMERGENCY: Apparent temp ${apparentTemp}°C and WBGT ${wbgtEstimate.toFixed(1)}°C exceed dangerous thresholds. Severe heat exhaustion & grid overload hazard at ${ward.name} (${ward.treeCanopyPct}% canopy).`;
    } else if (level === 'WARNING') {
      explanation = `HEAT WARNING: High thermal stress in concrete corridor. Microclimate heat island adds ~3°C. Protect vulnerable cohorts and monitor transformer temps.`;
    } else if (level === 'ADVISORY') {
      explanation = `HEAT ADVISORY: Warm conditions with moderate heat index. Hydration and shade protocols recommended.`;
    }

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
      weather.isStale || weather.dataQuality === 'STALE'
        ? 'LOW'
        : weather.dataQuality === 'DEGRADED'
        ? 'MEDIUM'
        : 'HIGH';

    return {
      score: finalScore,
      level,
      apparentTempC: apparentTemp,
      wetBulbGlobeTempC: Number(wbgtEstimate.toFixed(1)),
      heatStrainIndex: Math.round(hazardScore),
      factors,
      explanation,
      confidence,
    };
  }

  /**
   * Evaluate full multi-hazard composite risk for an asset
   */
  public evaluateAssetRisk(
    asset: Asset,
    ward: Ward,
    weather: WeatherReading
  ): AssetRiskAssessment {
    const floodRisk = this.calculateFloodRisk(asset, ward, weather);
    const heatRisk = this.calculateHeatRisk(asset, ward, weather);

    // Composite risk prioritization
    // If one hazard is extreme, it dominates the score; if both are present, compound multiplier applies
    let compositeScore: number;
    let primaryThreat: AssetRiskAssessment['primaryThreat'] = 'NONE';

    if (floodRisk.score >= 50 && heatRisk.score >= 50) {
      // Compound crisis
      compositeScore = Math.min(100, Math.max(floodRisk.score, heatRisk.score) * 1.1);
      primaryThreat = 'COMPOUND';
    } else if (floodRisk.score >= heatRisk.score) {
      compositeScore = floodRisk.score;
      primaryThreat = floodRisk.score >= 35 ? 'FLOOD' : 'NONE';
    } else {
      compositeScore = heatRisk.score;
      primaryThreat = heatRisk.score >= 35 ? 'HEAT' : 'NONE';
    }

    compositeScore = Math.round(compositeScore);

    let compositeLevel: AssetRiskAssessment['compositeLevel'] = 'LOW';
    if (compositeScore >= 80) compositeLevel = 'CRITICAL';
    else if (compositeScore >= 60) compositeLevel = 'HIGH';
    else if (compositeScore >= 35) compositeLevel = 'MODERATE';

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
      weather.isStale || weather.dataQuality === 'STALE'
        ? 'LOW'
        : weather.dataQuality === 'DEGRADED'
        ? 'MEDIUM'
        : 'HIGH';

    return {
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      wardId: ward.id,
      wardName: ward.name,
      criticality: asset.criticality,
      location: asset.location,
      floodRisk,
      heatRisk,
      compositeRiskScore: compositeScore,
      compositeLevel,
      primaryThreat,
      calculatedAt: new Date().toISOString(),
      confidence,
    };
  }
}

export const riskEngine = new RiskEngine();
