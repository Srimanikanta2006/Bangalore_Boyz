import { recommendLongTermAction } from "./hotspotCatalog.ts";
import type {
  HistoricalIncident,
  Hotspot,
  HotspotConfig,
  HotspotTrend,
} from "./hotspotTypes.ts";
import type { HazardType, RiskLevel } from "./schemas.ts";

export const DEFAULT_HOTSPOT_CONFIG: Required<HotspotConfig> = {
  minIncidentCount: 2,
  minRecurrenceScore: 15,
  referenceTimestamp: 0, // dynamically resolved to Date.now() if 0 or undefined
  halfLifeDays: 90,
};

const SEVERITY_BASE_SCORES: Record<RiskLevel, number> = {
  low: 20,
  medium: 45,
  high: 75,
  critical: 100,
};

const VALID_HAZARDS: HazardType[] = [
  "heavy_rainfall",
  "flood",
  "extreme_heat",
  "poor_air_quality",
  "cold",
  "snowfall",
  "cyclone",
  "high_tide",
  "storm_surge",
];

const VALID_SEVERITIES: RiskLevel[] = ["low", "medium", "high", "critical"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates untrusted historical incident records coming from database or API payloads.
 */
export function validateHistoricalIncident(input: unknown): { success: true; data: HistoricalIncident } | { success: false; errors: string[] } {
  if (!isRecord(input)) return { success: false, errors: ["Incident must be an object."] };

  const errors: string[] = [];
  if (!isNonEmptyString(input.incidentId)) errors.push("incidentId must be a non-empty string.");
  if (!isNonEmptyString(input.assetId)) errors.push("assetId must be a non-empty string.");
  if (!isNonEmptyString(input.timestamp) || Number.isNaN(Date.parse(input.timestamp))) {
    errors.push("timestamp must be a valid ISO 8601 date string.");
  }
  if (!VALID_HAZARDS.includes(input.hazardType as HazardType)) {
    errors.push(`hazardType '${String(input.hazardType)}' is not recognized.`);
  }
  if (!VALID_SEVERITIES.includes(input.severity as RiskLevel)) {
    errors.push(`severity '${String(input.severity)}' is not recognized.`);
  }
  if (input.riskScore !== undefined && (typeof input.riskScore !== "number" || input.riskScore < 0 || input.riskScore > 100)) {
    errors.push("riskScore must be a number between 0 and 100.");
  }

  if (errors.length > 0) return { success: false, errors };

  const incident: HistoricalIncident = {
    incidentId: (input.incidentId as string).trim(),
    timestamp: input.timestamp as string,
    assetId: (input.assetId as string).trim(),
    hazardType: input.hazardType as HazardType,
    severity: input.severity as RiskLevel,
  };
  if (isNonEmptyString(input.assetName)) incident.assetName = input.assetName.trim();
  if (typeof input.riskScore === "number") incident.riskScore = input.riskScore;
  if (typeof input.resolved === "boolean") incident.resolved = input.resolved;
  if (isRecord(input.metadata)) incident.metadata = input.metadata;

  return { success: true, data: incident };
}

/**
 * Validates a list of historical incident records, filtering out malformed entries.
 */
export function validateHistoricalIncidents(inputs: unknown[]): HistoricalIncident[] {
  if (!Array.isArray(inputs)) return [];
  const valid: HistoricalIncident[] = [];
  for (const item of inputs) {
    const res = validateHistoricalIncident(item);
    if (res.success) valid.push(res.data);
  }
  return valid;
}

function calculateTrend(sortedIncidents: HistoricalIncident[]): HotspotTrend {
  if (sortedIncidents.length < 3) return "insufficient_data";

  const firstTime = Date.parse(sortedIncidents[0].timestamp);
  const lastTime = Date.parse(sortedIncidents[sortedIncidents.length - 1].timestamp);
  const span = lastTime - firstTime;

  // If all incidents happened on the exact same second, trend is stable
  if (span <= 1000) return "stable";

  const midTime = firstTime + span / 2;
  const firstHalfCount = sortedIncidents.filter((inc) => Date.parse(inc.timestamp) < midTime).length;
  const secondHalfCount = sortedIncidents.filter((inc) => Date.parse(inc.timestamp) >= midTime).length;

  if (secondHalfCount >= firstHalfCount * 1.4 && secondHalfCount > firstHalfCount) {
    return "increasing";
  }
  if (firstHalfCount >= secondHalfCount * 1.4 && firstHalfCount > secondHalfCount) {
    return "decreasing";
  }
  return "stable";
}

function displayHazard(hazard: string): string {
  return hazard.replaceAll("_", " ");
}

function generateExplanation(
  assetName: string,
  hazardType: HazardType,
  incidents: HistoricalIncident[],
  timespanDays: number,
  recurrenceScore: number,
  trend: HotspotTrend,
): string {
  const count = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const highCount = incidents.filter((i) => i.severity === "high").length;
  const severeCount = criticalCount + highCount;

  const severityBreakdown =
    severeCount > 0
      ? ` (${criticalCount > 0 ? `${criticalCount} critical` : ""}${criticalCount > 0 && highCount > 0 ? ", " : ""}${highCount > 0 ? `${highCount} high` : ""})`
      : "";

  const trendDesc =
    trend === "increasing"
      ? "an accelerating recurrence trend"
      : trend === "decreasing"
      ? "a decelerating recurrence trend"
      : trend === "stable"
      ? "a consistent recurrence pattern"
      : "insufficient history for trend analysis";

  const timespanDesc = timespanDays <= 1 ? "the same day" : `the past ${timespanDays} days`;

  const urgencyDesc =
    recurrenceScore >= 75
      ? "Indicates critical structural vulnerability requiring high-priority capital intervention."
      : recurrenceScore >= 50
      ? "Indicates chronic operational vulnerability requiring planned infrastructure improvement."
      : "Indicates localized climate risk requiring preventive maintenance and monitoring.";

  return `${assetName} recorded ${count} ${displayHazard(hazardType)} incident${count === 1 ? "" : "s"} over ${timespanDesc}${severityBreakdown}, exhibiting ${trendDesc}. Recurrence score: ${recurrenceScore}/100. ${urgencyDesc}`;
}

/**
 * Computes hotspot intelligence from historical incidents using a deterministic,
 * explainable multi-factor recurrence algorithm.
 *
 * Factors:
 * 1. Incident Frequency: Recency-weighted count of historical events.
 * 2. Recency: Exponential decay with configurable half-life (default: 90 days).
 * 3. Severity: Normalized weighted average of event severities.
 * 4. Hazard Repetition: Isolated per (asset, hazard) pairing.
 * 5. Timespan & Trend: Chronological distribution over observation window.
 */
export function computeHotspots(
  rawIncidents: HistoricalIncident[],
  options: HotspotConfig = {},
): Hotspot[] {
  const minCount = options.minIncidentCount ?? DEFAULT_HOTSPOT_CONFIG.minIncidentCount;
  const minScore = options.minRecurrenceScore ?? DEFAULT_HOTSPOT_CONFIG.minRecurrenceScore;
  const halfLifeDays = options.halfLifeDays ?? DEFAULT_HOTSPOT_CONFIG.halfLifeDays;

  const refTime = options.referenceTimestamp
    ? typeof options.referenceTimestamp === "number"
      ? options.referenceTimestamp
      : Date.parse(options.referenceTimestamp)
    : Date.now();

  // 1. Group incidents by (assetId, hazardType)
  const groups = new Map<string, HistoricalIncident[]>();
  for (const incident of rawIncidents) {
    const key = `${incident.assetId}::${incident.hazardType}`;
    const group = groups.get(key) ?? [];
    group.push(incident);
    groups.set(key, group);
  }

  const hotspots: Hotspot[] = [];

  for (const [key, groupIncidents] of groups.entries()) {
    // Avoid false hotspots: filter out isolated events below minimum count threshold
    if (groupIncidents.length < minCount) {
      continue;
    }

    // Sort chronologically ascending
    const sorted = [...groupIncidents].sort(
      (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
    );

    const [assetId, hazardTypeStr] = key.split("::");
    const hazardType = hazardTypeStr as HazardType;
    const assetName = sorted.find((i) => i.assetName)?.assetName ?? assetId;

    const firstIncidentAt = sorted[0].timestamp;
    const lastIncidentAt = sorted[sorted.length - 1].timestamp;
    const firstEpoch = Date.parse(firstIncidentAt);
    const lastEpoch = Date.parse(lastIncidentAt);
    const timespanDays = Math.max(1, Math.round((lastEpoch - firstEpoch) / (1000 * 60 * 60 * 24)));

    // 2. Compute Recency Weights and Severity
    let totalWeight = 0;
    let weightedSeveritySum = 0;

    for (const inc of sorted) {
      const incTime = Date.parse(inc.timestamp);
      const daysAgo = Math.max(0, (refTime - incTime) / (1000 * 60 * 60 * 24));
      // Exponential decay: weight = 0.5 ^ (daysAgo / halfLifeDays)
      const weight = Math.pow(0.5, daysAgo / halfLifeDays);

      const baseScore = SEVERITY_BASE_SCORES[inc.severity] ?? 20;
      const effectiveSeverity = typeof inc.riskScore === "number" ? Math.max(inc.riskScore, baseScore) : baseScore;

      totalWeight += weight;
      weightedSeveritySum += weight * effectiveSeverity;
    }

    const severityScore = totalWeight > 0 ? Math.round(weightedSeveritySum / totalWeight) : 50;

    // Frequency score: 5 recent events saturates frequency to 100
    const frequencyScore = Math.min(100, Math.round(totalWeight * 20));

    // Multi-factor composite Recurrence Score: 55% Frequency + 45% Severity
    const recurrenceScore = Math.min(100, Math.max(0, Math.round(0.55 * frequencyScore + 0.45 * severityScore)));

    if (recurrenceScore < minScore) {
      continue;
    }

    // 3. Trend analysis
    const trend = calculateTrend(sorted);

    // 4. Grounded Confidence (0.60 to 0.95 based on count)
    const confidence = Math.min(0.95, Math.round((0.6 + Math.min(sorted.length, 7) * 0.05) * 100) / 100);

    // 5. Deterministic Explanation
    const explanation = generateExplanation(
      assetName,
      hazardType,
      sorted,
      timespanDays,
      recurrenceScore,
      trend,
    );

    // 6. Recommended Long-Term Action from Controlled Catalog
    const recommendedLongTermAction = recommendLongTermAction(
      hazardType,
      recurrenceScore,
      assetId,
      assetName,
    );

    const hotspotId = `HOTSPOT-${assetId}-${hazardType.toUpperCase().replaceAll("_", "-")}`;

    hotspots.push({
      hotspotId,
      assetId,
      assetName,
      hazardType,
      incidentCount: sorted.length,
      recurrenceScore,
      severityScore,
      lastIncidentAt,
      firstIncidentAt,
      timespanDays,
      trend,
      confidence,
      explanation,
      recommendedLongTermAction,
    });
  }

  // Sort hotspots by recurrenceScore descending
  return hotspots.sort((a, b) => b.recurrenceScore - a.recurrenceScore);
}
