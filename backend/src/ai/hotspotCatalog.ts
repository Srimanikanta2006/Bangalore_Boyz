import type { HazardType } from "./schemas.ts";
import type { LongTermActionId, LongTermActionRecommendation } from "./hotspotTypes.ts";

export interface LongTermActionDefinition {
  actionId: LongTermActionId;
  label: string;
  description: string;
  horizon: "short_term_maintenance" | "medium_term_retrofit" | "long_term_capital";
  primaryHazards: HazardType[];
}

export const LONG_TERM_ACTION_CATALOG: LongTermActionDefinition[] = [
  {
    actionId: "drainage_capacity_upgrade",
    label: "Drainage Capacity Upgrade",
    description: "Widen conduit culverts and install high-volume stormwater pumping units for permanent throughput upgrade.",
    horizon: "long_term_capital",
    primaryHazards: ["heavy_rainfall", "flood", "cyclone"],
  },
  {
    actionId: "drainage_maintenance",
    label: "Scheduled Silt & Debris Clearing",
    description: "Establish recurring preventive de-silting and automated blockage sensors before peak monsoon periods.",
    horizon: "short_term_maintenance",
    primaryHazards: ["heavy_rainfall", "flood"],
  },
  {
    actionId: "road_drainage_improvement",
    label: "Roadway Camber & Ingress Retrofit",
    description: "Re-engineer road elevation, porous shoulders, and drainage scuppers to prevent roadway pooling.",
    horizon: "medium_term_retrofit",
    primaryHazards: ["heavy_rainfall", "flood"],
  },
  {
    actionId: "flood_barrier_installation",
    label: "Permanent Flood Barriers & Sump Stations",
    description: "Install permanent perimeter flood gates and backup sump stations around vulnerable substations and facilities.",
    horizon: "medium_term_retrofit",
    primaryHazards: ["flood", "high_tide", "storm_surge", "cyclone"],
  },
  {
    actionId: "permeable_pavement_retrofit",
    label: "Permeable Pavement Installation",
    description: "Replace impermeable asphalt in surrounding parking lots and walkways with water-absorbing porous surfaces.",
    horizon: "medium_term_retrofit",
    primaryHazards: ["heavy_rainfall", "flood"],
  },
  {
    actionId: "heat_mitigation",
    label: "Cool Roofs & Thermal Shielding",
    description: "Apply high-albedo reflective coatings and passive ventilation retrofits on public and healthcare buildings.",
    horizon: "medium_term_retrofit",
    primaryHazards: ["extreme_heat"],
  },
  {
    actionId: "urban_canopy_expansion",
    label: "Urban Shade Canopy & Micro-Mist Hubs",
    description: "Plant native shade trees and construct shaded mist corridors along high-density pedestrian routes.",
    horizon: "long_term_capital",
    primaryHazards: ["extreme_heat"],
  },
  {
    actionId: "air_quality_monitoring",
    label: "Hyperlocal Air Filtration & Monitoring Grid",
    description: "Install continuous particulate sensors, air-curtain filtration in public facilities, and dust suppression systems.",
    horizon: "short_term_maintenance",
    primaryHazards: ["poor_air_quality"],
  },
  {
    actionId: "infrastructure_reinforcement",
    label: "Structural Weather-Hardening & Grid Backup",
    description: "Elevate critical electrical panels, reinforce wall structures, and install secondary islanded power feeds.",
    horizon: "long_term_capital",
    primaryHazards: ["cyclone", "storm_surge", "snowfall", "cold"],
  },
];

export function getLongTermActionDefinition(actionId: LongTermActionId): LongTermActionDefinition | undefined {
  return LONG_TERM_ACTION_CATALOG.find((action) => action.actionId === actionId);
}

/**
 * Deterministically selects the best long-term intervention based on hazard,
 * recurrence score, and asset context.
 */
export function recommendLongTermAction(
  hazardType: HazardType,
  recurrenceScore: number,
  assetId: string,
  assetName?: string,
): LongTermActionRecommendation {
  const normalizedId = assetId.toUpperCase();
  const name = assetName ?? assetId;

  if (hazardType === "heavy_rainfall" || hazardType === "flood") {
    if (normalizedId.startsWith("D") || name.toLowerCase().includes("drain")) {
      if (recurrenceScore >= 70) {
        return {
          actionId: "drainage_capacity_upgrade",
          label: "Drainage Capacity Upgrade",
          description: `Permanently expand volumetric flow capacity and culvert diameter at ${name}.`,
          horizon: "long_term_capital",
          rationale: `Recurrence score (${recurrenceScore}/100) reflects persistent capacity exhaustion during rainfall events.`,
        };
      }
      return {
        actionId: "drainage_maintenance",
        label: "Scheduled Silt & Debris Clearing",
        description: `Implement high-frequency pre-monsoon desilting and sensor telemetry at ${name}.`,
        horizon: "short_term_maintenance",
        rationale: `Recurring incidents at ${name} indicate silt accumulation and maintenance bottlenecks.`,
      };
    }

    if (normalizedId.startsWith("R") || name.toLowerCase().includes("road")) {
      return {
        actionId: "road_drainage_improvement",
        label: "Roadway Camber & Ingress Retrofit",
        description: `Re-grade roadway surface and add high-capacity roadside drainage channels along ${name}.`,
        horizon: "medium_term_retrofit",
        rationale: `Repeated surface ponding at ${name} disrupts primary emergency and transit access.`,
      };
    }

    if (normalizedId.startsWith("S") || name.toLowerCase().includes("substation") || normalizedId.startsWith("H")) {
      return {
        actionId: "flood_barrier_installation",
        label: "Permanent Flood Barriers & Sump Stations",
        description: `Construct perimeter bunds, floodgates, and dual-redundancy sump pumps around ${name}.`,
        horizon: "medium_term_retrofit",
        rationale: `Critical facility ${name} is exposed to repeated flood inundation cascades.`,
      };
    }

    return {
      actionId: "permeable_pavement_retrofit",
      label: "Permeable Pavement Installation",
      description: `Retrofit catchment area surrounding ${name} with permeable pavement systems.`,
      horizon: "medium_term_retrofit",
      rationale: `Reduces surface runoff volume accumulating at recurring waterlogging point ${name}.`,
    };
  }

  if (hazardType === "extreme_heat") {
    if (recurrenceScore >= 60) {
      return {
        actionId: "urban_canopy_expansion",
        label: "Urban Shade Canopy & Micro-Mist Hubs",
        description: `Plant mature tree canopy buffer zones and install shaded hydration stations around ${name}.`,
        horizon: "long_term_capital",
        rationale: `Chronic thermal hotspot with ${recurrenceScore}/100 recurrence requires structural urban greening.`,
      };
    }
    return {
      actionId: "heat_mitigation",
      label: "Cool Roofs & Thermal Shielding",
      description: `Apply reflective solar-barrier roof coatings and passive cooling ventilation at ${name}.`,
      horizon: "medium_term_retrofit",
      rationale: `Reduces internal heat absorption for vulnerable facilities during heatwaves.`,
    };
  }

  if (hazardType === "poor_air_quality") {
    return {
      actionId: "air_quality_monitoring",
      label: "Hyperlocal Air Filtration & Monitoring Grid",
      description: `Deploy continuous particulate sensor nodes and air purification barriers around ${name}.`,
      horizon: "short_term_maintenance",
      rationale: `Recurring air quality alerts warrant localized containment and real-time monitoring.`,
    };
  }

  return {
    actionId: "infrastructure_reinforcement",
    label: "Structural Weather-Hardening & Grid Backup",
    description: `Perform structural wind/weather reinforcement and install isolated backup systems at ${name}.`,
    horizon: "long_term_capital",
    rationale: `Multi-hazard historical risk indicates need for comprehensive structural weather-hardening.`,
  };
}
