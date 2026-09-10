import {
  Asset,
  AssetRiskAssessment,
  Alert,
  ActionPlaybookSOP,
  WeatherReading,
} from '../types.js';

export class SOPEngine {
  /**
   * Evaluates an asset's risk assessment and triggers an alert with an actionable SOP if thresholds are breached
   */
  public generateAlertFromRisk(
    assessment: AssetRiskAssessment,
    asset: Asset,
    weather: WeatherReading
  ): Alert | null {
    // Only trigger alerts for moderate, high, or critical risks
    if (assessment.compositeRiskScore < 38) {
      return null;
    }

    let severity: Alert['severity'] = 'WARNING';
    if (assessment.compositeRiskScore >= 80) severity = 'CRITICAL';
    else if (assessment.compositeRiskScore >= 60) severity = 'HIGH';

    const hazardType = assessment.primaryThreat === 'NONE' ? 'FLOOD' : assessment.primaryThreat;

    const sop = this.buildSOP(asset, assessment, hazardType, severity);

    let title = '';
    let description = '';

    if (hazardType === 'FLOOD') {
      title = `${severity} Flood Inundation Alert: ${asset.name}`;
      description = `Pluvial inundation risk calculated at ${assessment.floodRisk.score}/100. Projected water depth: ~${assessment.floodRisk.projectedInundationDepthCm}cm at elevation ${asset.elevationM}m. Drain deficit: ${assessment.floodRisk.drainageDeficitMmHr} mm/hr.`;
    } else if (hazardType === 'HEAT') {
      title = `${severity} Thermal Stress Alert: ${asset.name}`;
      description = `Severe heat index of ${assessment.heatRisk.apparentTempC}°C (Score ${assessment.heatRisk.score}/100) affecting ${asset.populationServed.toLocaleString()} residents/commuters in ${asset.wardName}.`;
    } else {
      title = `${severity} Compound Climate Crisis: ${asset.name}`;
      description = `Co-occurring thermal overload and pluvial surge. Immediate inter-agency coordination activated.`;
    }

    const alertId = `alert-${asset.id}-${Date.now().toString(36)}`;

    return {
      id: alertId,
      timestamp: new Date().toISOString(),
      assetId: asset.id,
      assetName: asset.name,
      wardId: asset.wardId,
      wardName: asset.wardName,
      hazardType,
      severity,
      title,
      description,
      triggerMetrics: {
        rainfallMmHr: weather.precipitationRateMmHr,
        tempC: weather.temperatureC,
        apparentTempC: weather.apparentTempC,
        drainDeficit: assessment.floodRisk.drainageDeficitMmHr,
        inundationDepthCm: assessment.floodRisk.projectedInundationDepthCm,
        compositeScore: assessment.compositeRiskScore,
      },
      sop,
      status: 'NEW',
      actionHistory: [
        {
          timestamp: new Date().toISOString(),
          action: 'ALERT_TRIGGERED',
          actor: 'ClimateShield Autonomous Risk Engine',
          notes: `Threshold exceeded (Risk Score ${assessment.compositeRiskScore}). SOP ${sop.sopId} generated.`,
        },
      ],
    };
  }

  /**
   * Synthesize tactical Standard Operating Procedures (SOPs) based on asset and hazard
   */
  private buildSOP(
    asset: Asset,
    assessment: AssetRiskAssessment,
    hazardType: 'FLOOD' | 'HEAT' | 'COMPOUND',
    severity: Alert['severity']
  ): ActionPlaybookSOP {
    if (hazardType === 'FLOOD') {
      return this.buildFloodSOP(asset, assessment, severity);
    } else if (hazardType === 'HEAT') {
      return this.buildHeatSOP(asset, assessment, severity);
    } else {
      return this.buildCompoundSOP(asset, assessment, severity);
    }
  }

  private buildFloodSOP(
    asset: Asset,
    assessment: AssetRiskAssessment,
    severity: Alert['severity']
  ): ActionPlaybookSOP {
    const isHospital = asset.type === 'HOSPITAL';
    const isSubstation = asset.type === 'POWER_SUBSTATION';
    const isMetro = asset.type === 'METRO_STATION';
    const isSettlement = asset.type === 'RESIDENTIAL_SETTLEMENT';
    const isJunction = asset.type === 'CRITICAL_ROAD_JUNCTION';

    let primaryAction = '';
    const tacticalSteps: string[] = [];
    const equipmentRequired: string[] = [];
    let assignedTeam = asset.contactTeam || 'BBMP Rapid Flood Mitigation Cell';
    let prioritySlaMinutes = severity === 'CRITICAL' ? 20 : severity === 'HIGH' ? 45 : 90;

    if (isSubstation) {
      primaryAction = `Deploy rapid barrier deflector and dewatering pumps to prevent ${asset.name} 11kV transformer short-circuit.`;
      tacticalSteps.push(
        'Step 1: Check water accumulation level around transformer yard bund walls.',
        'Step 2: Start auxiliary high-capacity diesel dewatering pump (400 m³/hr).',
        'Step 3: If water reaches 30cm, coordinate with State Load Dispatch Center (SLDC) for safe circuit isolation.',
        'Step 4: Dispatch BESCOM mobile diesel generator for critical auxiliary power.'
      );
      equipmentRequired.push('2x 100 HP Mobile Dewatering Pumps', 'Flood Barriers (Quick-deploy modular)', 'Transformer Insulating Mats', 'Emergency Diesel Generator');
      assignedTeam = 'BESCOM Emergency Grid Defense Division';
    } else if (isHospital) {
      primaryAction = `Safeguard basement imaging/ICU power grid and deploy sump ejector at ${asset.name}.`;
      tacticalSteps.push(
        'Step 1: Inspect basement level 1 and 2 retention sumps and verify auto-ejector pump float switches.',
        'Step 2: Erect rapid sandbag perimeter along ambulance entrance and oxygen plant ramp.',
        'Step 3: Transfer critical patient life-support circuits to elevated secondary generator bus.',
        'Step 4: Alert local disaster management unit for emergency patient transfer corridors if water ingress continues.'
      );
      equipmentRequired.push('Submersible Sump Pumps (4x)', 'Sandbag Bunding (150 units)', 'Auxiliary UPS Verification Unit', 'Ambulance Rerouting Signage');
      assignedTeam = 'Hospital Disaster Management Cell & SDRF';
    } else if (isMetro || isJunction) {
      primaryAction = `Divert arterial transit traffic and mobilize suction trucks to clear ${asset.name} underpass choke points.`;
      tacticalSteps.push(
        'Step 1: Deploy traffic police interceptor squad to halt vehicles entering flooded underpass.',
        'Step 2: Clear stormwater silt grates and suction drain intakes using super-sucker tanker.',
        'Step 3: Activate station flood gates at pedestrian subways to prevent metro concourse inundation.',
        'Step 4: Broadcast real-time transit detour alert via Public Announcement and City Mobility App.'
      );
      equipmentRequired.push('2x Super Sucker Jetting Units', 'LED Traffic Diversion Boards', 'Pneumatic Flood Gates', 'Portable High-Head Pumps');
      assignedTeam = 'Bangalore Traffic Police & BBMP SWD Wing';
    } else if (isSettlement) {
      primaryAction = `Pre-position evacuation transport and open dry relief shelters for ${asset.populationServed.toLocaleString()} residents in ${asset.name}.`;
      tacticalSteps.push(
        'Step 1: Issue localized door-to-door alert via megaphone in vernacular Kannada and English.',
        'Step 2: Evacuate ground-floor elder and infant residents to Ward 151 Community Center.',
        'Step 3: Distribute potable water sachets and emergency halogen illumination kits.',
        'Step 4: Deploy motorized rescue boats along low-lying feeder canals if depth exceeds 50cm.'
      );
      equipmentRequired.push('2x Inflatable Rescue Zodiac Boats', 'Drinking Water Supply Tankers', 'Emergency Food Rations (1,000 packs)', 'High-Intensity Floodlights');
      assignedTeam = 'SDRF / Civil Defence Rapid Evacuation Taskforce';
    } else {
      primaryAction = `Activate automated stormwater sluices and mobilize dewatering team at ${asset.name}.`;
      tacticalSteps.push(
        'Step 1: Verify drain outlet flow rate and remove trapped debris.',
        'Step 2: Power up secondary pump unit.',
        'Step 3: Inspect surrounding perimeter for soil erosion or structural ponding.'
      );
      equipmentRequired.push('Mobile Trailer Pump', 'Debris Excavator Hook', 'Fuel Refill Canisters');
    }

    return {
      sopId: `SOP-FLD-${asset.type.substring(0, 4)}-${severity}`,
      title: `Tactical Flood Action Plan: ${asset.name}`,
      primaryAction,
      tacticalSteps,
      equipmentRequired,
      assignedTeam,
      prioritySlaMinutes,
    };
  }

  private buildHeatSOP(
    asset: Asset,
    assessment: AssetRiskAssessment,
    severity: Alert['severity']
  ): ActionPlaybookSOP {
    let primaryAction = `Activate urban cool shelter, public hydration stations, and thermal relief for ${asset.name}.`;
    const tacticalSteps: string[] = [
      'Step 1: Open air-conditioned public respite centers and shade awnings.',
      'Step 2: Deploy ORS (Oral Rehydration Solution) distribution booths along high-footfall corridors.',
      'Step 3: Suspend non-essential outdoor manual construction and maintenance work between 11:30 AM and 4:00 PM.',
      'Step 4: Spritz fine misting water cannons along asphalt roadways to suppress radiative surface temperature.'
    ];
    const equipmentRequired: string[] = [
      'Mobile Misting Coolers (4x)',
      'ORS Hydration Kits (2,500 sachets)',
      'Digital Infrared Core-Temp Scanners',
      'Road Surface Sprinkling Tanker'
    ];
    let assignedTeam = 'Municipal Public Health & Heat Action Taskforce';
    const prioritySlaMinutes = severity === 'CRITICAL' ? 30 : 60;

    if (asset.type === 'POWER_SUBSTATION') {
      primaryAction = `Initiate forced oil-cooling and thermal scanning on overloaded power transformers at ${asset.name}.`;
      tacticalSteps.splice(0, tacticalSteps.length,
        'Step 1: Conduct FLIR thermal imaging inspection on transformer bushings and cooling radiators.',
        'Step 2: Turn on supplemental forced-air radiator fans and oil circulation cooling pumps.',
        'Step 3: Balance feeder load to prevent insulation breakdown under maximum air-conditioning demand.',
        'Step 4: Station standby fire tender with CO₂ chemical foam near capacitor bank.'
      );
      equipmentRequired.splice(0, equipmentRequired.length,
        'FLIR Thermal Camera',
        'Auxiliary Radiator Blowers',
        'CO2 Fire Suppression Tender'
      );
      assignedTeam = 'BESCOM Grid Reliability & Thermal Defense Cell';
    } else if (asset.type === 'HOSPITAL') {
      primaryAction = `Scale up emergency heatstroke triage beds and verify critical HVAC chiller redundancy at ${asset.name}.`;
      tacticalSteps.splice(0, tacticalSteps.length,
        'Step 1: Activate designated 20-bed Heatstroke Rapid Cooling Unit in emergency department.',
        'Step 2: Stock cold intravenous normal saline, ice baths, and cooling blankets.',
        'Step 3: Inspect primary and secondary chiller compressors for uninterrupted operation.',
        'Step 4: Stand by mobile triage paramedics for emergency calls from nearby high-density settlements.'
      );
      equipmentRequired.splice(0, equipmentRequired.length,
        'Cooling Blankets & Immersion Baths',
        'Chilled IV Fluids Inventory',
        'Industrial Chiller Backup Fans'
      );
      assignedTeam = 'Emergency Medical Response & Health Directorate';
    }

    return {
      sopId: `SOP-HEAT-${asset.type.substring(0, 4)}-${severity}`,
      title: `Heat Stress Mitigation SOP: ${asset.name}`,
      primaryAction,
      tacticalSteps,
      equipmentRequired,
      assignedTeam,
      prioritySlaMinutes,
    };
  }

  private buildCompoundSOP(
    asset: Asset,
    assessment: AssetRiskAssessment,
    severity: Alert['severity']
  ): ActionPlaybookSOP {
    return {
      sopId: `SOP-CMPD-${asset.type.substring(0, 4)}-${severity}`,
      title: `Compound Extreme Hazard Protocol: ${asset.name}`,
      primaryAction: `Coordinate simultaneous flood barrier deployment and emergency cooling grid isolation at ${asset.name}.`,
      tacticalSteps: [
        'Step 1: Isolate flood-vulnerable electrical switchgear while sustaining hospital/shelter HVAC through protected risers.',
        'Step 2: Dispatch dual-purpose multi-agency response teams (Fire & Rescue, Municipal SWD, Health).',
        'Step 3: Establish incident command post at nearest unaffected zone headquarters.',
        'Step 4: Provide real-time hourly status updates to the City Disaster Management Authority.'
      ],
      equipmentRequired: [
        'High-Capacity Water Pumping Units',
        'Emergency Power Isolation Kits',
        'Satellite Communications Terminal',
        'Inter-Agency Tactical Command Van'
      ],
      assignedTeam: 'Joint Municipal Disaster Management Command',
      prioritySlaMinutes: 15,
    };
  }
}

export const sopEngine = new SOPEngine();
