/**
 * Controlled Action Catalog
 * =========================
 *
 * Agents may ONLY recommend actions from this catalog, and only at an allowed
 * priority. This mirrors the grounding guarantee already used by the backend
 * explanation layer (cline_backend/src/ai/actionCatalog.ts): the AI is
 * decision-support, so its action space is a closed, auditable set. Anything
 * outside this catalog is rejected by the ValidationAgent.
 */

import type { ActionPriority } from "./types";

export interface CatalogAction {
  id: string;
  label: string;
  allowedPriorities: ActionPriority[];
  /** Asset types this action is naturally suited to (advisory, for planning). */
  suitedAssetTypes: string[];
  /** Unit types that typically execute this action (advisory). */
  suitedUnitTypes: string[];
  description: string;
}

export const ACTION_CATALOG: readonly CatalogAction[] = [
  {
    id: "dispatch_drainage_team",
    label: "Dispatch drainage / pump crew",
    allowedPriorities: ["high", "critical"],
    suitedAssetTypes: ["DRAIN", "PUMPING_STATION", "ROAD", "BRIDGE"],
    suitedUnitTypes: ["PUMP_CREW", "PUBLIC_WORKS", "HEAVY_EQUIPMENT"],
    description: "Deploy pump/drainage crew to clear or mitigate inundation at the asset.",
  },
  {
    id: "close_road",
    label: "Close road / arterial",
    allowedPriorities: ["high", "critical"],
    suitedAssetTypes: ["ROAD", "BRIDGE", "AMBULANCE_GATE"],
    suitedUnitTypes: ["BARRIER_CREW", "POLICE", "PUBLIC_WORKS"],
    description: "Close a flooded or unsafe roadway to traffic.",
  },
  {
    id: "open_alternate_route",
    label: "Open alternate route",
    allowedPriorities: ["medium", "high", "critical"],
    suitedAssetTypes: ["ROAD", "BRIDGE"],
    suitedUnitTypes: ["BARRIER_CREW", "POLICE", "PUBLIC_WORKS"],
    description: "Establish and sign an alternate route around an impassable segment.",
  },
  {
    id: "pre_position_ambulance",
    label: "Pre-position ambulance / EMS",
    allowedPriorities: ["high", "critical"],
    suitedAssetTypes: ["HOSPITAL", "AMBULANCE_GATE", "EVACUATION_SHELTER"],
    suitedUnitTypes: ["EMS", "FIRE_RESCUE"],
    description: "Stage EMS near a facility whose access is threatened by the cascade.",
  },
  {
    id: "notify_facility",
    label: "Notify facility manager",
    allowedPriorities: ["medium", "high", "critical"],
    suitedAssetTypes: ["HOSPITAL", "SUBSTATION", "WATER_TREATMENT", "COOLING_CENTER"],
    suitedUnitTypes: [],
    description: "Formally notify a critical-facility manager of projected impact.",
  },
  {
    id: "issue_local_advisory",
    label: "Issue local public advisory",
    allowedPriorities: ["medium", "high", "critical"],
    suitedAssetTypes: ["ROAD", "BRIDGE", "DRAIN", "HOSPITAL", "OTHER"],
    suitedUnitTypes: [],
    description: "Issue a local, zone-scoped public advisory (never a false all-clear).",
  },
] as const;

const CATALOG_BY_ID = new Map(ACTION_CATALOG.map((a) => [a.id, a] as const));

export function isValidActionId(actionId: string): boolean {
  return CATALOG_BY_ID.has(actionId);
}

export function getCatalogAction(actionId: string): CatalogAction | undefined {
  return CATALOG_BY_ID.get(actionId);
}

export function isPriorityAllowed(actionId: string, priority: ActionPriority): boolean {
  const action = CATALOG_BY_ID.get(actionId);
  return action ? action.allowedPriorities.includes(priority) : false;
}

/** Actions naturally suited to a given asset type (used by deterministic planning). */
export function actionsForAssetType(assetType: string): CatalogAction[] {
  return ACTION_CATALOG.filter((a) => a.suitedAssetTypes.includes(assetType));
}

/** The catalog rendered for an LLM prompt (id + allowed priorities). */
export function catalogPromptBlock(): string {
  return ACTION_CATALOG.map(
    (a) => `- ${a.id} (allowed priorities: ${a.allowedPriorities.join(", ")}) — ${a.description}`,
  ).join("\n");
}
