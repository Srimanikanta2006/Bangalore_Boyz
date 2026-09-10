/**
 * Exports a Hazard (a real DB record — active threat tied to a Zone) as a valid
 * OASIS Common Alerting Protocol v1.2 XML alert message.
 *
 * Scope (see docs/MASTER_PLAN.md Chunk F2 for the full honest write-up): this
 * demonstrates PROTOCOL-LEVEL COMPATIBILITY with India's national CAP-based
 * dissemination chain (SACHET/NDMA). It does NOT claim to BE SACHET, does NOT
 * ingest SACHET's feed (no confirmed working public URL was found), and every
 * exported alert is marked `status=Exercise` — the CAP-correct value for a
 * non-operational/demo message — so it can never be mistaken for a real
 * government warning.
 *
 * Reference: OASIS CAP v1.2 spec, https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html
 */

import type { Prisma } from '@prisma/client';

type HazardWithZone = Prisma.HazardGetPayload<{ include: { zone: true } }>;

const CAP_CATEGORY: Record<string, string> = {
  FLOOD: 'Met',
  FLASH_FLOOD: 'Met',
  EXTREME_HEAT: 'Met',
  STORM: 'Met',
  HIGH_WIND: 'Met',
  DRAINAGE_OVERFLOW: 'Met',
  POWER_FAILURE: 'Safety',
  OTHER: 'Other',
};

const CAP_EVENT_LABEL: Record<string, string> = {
  FLOOD: 'Flood',
  FLASH_FLOOD: 'Flash Flood',
  EXTREME_HEAT: 'Extreme Heat',
  STORM: 'Severe Storm',
  HIGH_WIND: 'High Wind',
  DRAINAGE_OVERFLOW: 'Drainage Overflow',
  POWER_FAILURE: 'Power Failure',
  OTHER: 'Hazard',
};

const CAP_SEVERITY: Record<string, string> = {
  LOW: 'Minor',
  MODERATE: 'Moderate',
  HIGH: 'Severe',
  CRITICAL: 'Extreme',
};

const CAP_URGENCY: Record<string, string> = {
  LOW: 'Future',
  MODERATE: 'Expected',
  HIGH: 'Expected',
  CRITICAL: 'Immediate',
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Builds a CAP <area> block. Uses the zone's real OSM polygon when it's a simple
 *  Polygon/MultiPolygon GeoJSON; otherwise falls back to a <circle> around the
 *  zone's real centroid (radius is a labeled approximation, not a measured boundary). */
function buildAreaXml(zone: HazardWithZone['zone']): string {
  const geojson = zone.boundaryGeoJson as { type?: string; coordinates?: unknown } | null;
  if (geojson?.type === 'Polygon' && Array.isArray(geojson.coordinates)) {
    const ring = (geojson.coordinates as number[][][])[0];
    if (Array.isArray(ring) && ring.length >= 3) {
      // GeoJSON is [lng, lat]; CAP polygon points are "lat,lon" space-separated, ring must close.
      const points = ring.map(([lng, lat]) => `${lat},${lng}`);
      if (points[0] !== points[points.length - 1]) points.push(points[0]);
      return `<area><areaDesc>${xmlEscape(zone.name)}</areaDesc><polygon>${points.join(' ')}</polygon></area>`;
    }
  }
  // Fallback: circle around the zone's real centroid. 3km is a labeled placeholder
  // radius (not a measured boundary) - honest since we don't have real polygon data
  // for every zone yet (see MASTER_PLAN §1b on Chennai-only real geometry).
  return `<area><areaDesc>${xmlEscape(zone.name)}</areaDesc><circle>${zone.latitude},${zone.longitude} 3.0</circle></area>`;
}

/** Renders one Hazard as a complete, valid CAP 1.2 <alert> XML document. */
export function hazardToCapXml(hazard: HazardWithZone): string {
  const sent = new Date().toISOString();
  const category = CAP_CATEGORY[hazard.type] ?? 'Other';
  const eventLabel = CAP_EVENT_LABEL[hazard.type] ?? 'Hazard';
  const severity = CAP_SEVERITY[hazard.severity] ?? 'Unknown';
  const urgency = CAP_URGENCY[hazard.severity] ?? 'Unknown';
  const status = hazard.status === 'ACTIVE' ? 'Actual' : 'Actual'; // still Exercise-scoped below, see <status>
  void status;

  const headline = `${eventLabel} — ${hazard.zone.name}`;
  const description = [
    `${eventLabel} reported in ${hazard.zone.name}.`,
    hazard.rainfallRate != null ? `Rainfall rate: ${hazard.rainfallRate} mm/h.` : null,
    hazard.waterDepth != null ? `Water depth: ${hazard.waterDepth} m.` : null,
    hazard.windSpeed != null ? `Wind speed: ${hazard.windSpeed} km/h.` : null,
    hazard.temperature != null ? `Temperature: ${hazard.temperature}°C.` : null,
  ].filter(Boolean).join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${xmlEscape(hazard.id)}</identifier>
  <sender>alerts@climateshield-demo.local</sender>
  <sent>${sent}</sent>
  <status>Exercise</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>${category}</category>
    <event>${xmlEscape(eventLabel)}</event>
    <urgency>${urgency}</urgency>
    <severity>${severity}</severity>
    <certainty>Observed</certainty>
    <effective>${new Date(hazard.startedAt).toISOString()}</effective>
    ${hazard.endedAt ? `<expires>${new Date(hazard.endedAt).toISOString()}</expires>` : ''}
    <senderName>ClimateShield (hackathon demo — not an official government alert)</senderName>
    <headline>${xmlEscape(headline)}</headline>
    <description>${xmlEscape(description)}</description>
    ${buildAreaXml(hazard.zone)}
  </info>
</alert>`;
}
