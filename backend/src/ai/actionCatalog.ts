import type { RiskLevel } from "./schemas.ts";

export interface ActionDefinition {
  actionId: string;
  label: string;
  description: string;
  allowedPriorities: RiskLevel[];
}

export const ACTION_CATALOG: ActionDefinition[] = [
  {
    actionId: "dispatch_drainage_team",
    label: "Dispatch drainage team",
    description: "Send a team to inspect or clear a high-risk drainage location.",
    allowedPriorities: ["high", "critical"],
  },
  {
    actionId: "close_road",
    label: "Close road",
    description: "Temporarily restrict access to a hazard-affected road.",
    allowedPriorities: ["high", "critical"],
  },
  {
    actionId: "open_alternate_route",
    label: "Open alternate route",
    description: "Direct traffic or emergency access through a safer route.",
    allowedPriorities: ["medium", "high", "critical"],
  },
  {
    actionId: "pre_position_ambulance",
    label: "Pre-position ambulance",
    description: "Move emergency medical resources closer to an at-risk area.",
    allowedPriorities: ["high", "critical"],
  },
  {
    actionId: "notify_facility",
    label: "Notify facility",
    description: "Notify an affected facility about an operational risk.",
    allowedPriorities: ["medium", "high", "critical"],
  },
  {
    actionId: "issue_local_advisory",
    label: "Issue local advisory",
    description: "Issue a localized advisory for an affected area or facility.",
    allowedPriorities: ["medium", "high", "critical"],
  },
];

export function getActionDefinition(actionId: string): ActionDefinition | undefined {
  return ACTION_CATALOG.find((action) => action.actionId === actionId);
}

export function isValidAction(actionId: string): boolean {
  return getActionDefinition(actionId) !== undefined;
}

export function isAllowedActionPriority(
  actionId: string,
  priority: RiskLevel,
): boolean {
  return getActionDefinition(actionId)?.allowedPriorities.includes(priority) ?? false;
}

