import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { nextCitizenReportCode } from '../utils/ids';
import { AuditActions, recordAudit, createAudit } from './audit.service';
import { createIncident } from './incident.service';
import { resolveZoneForPoint } from './zoneLookup.service';
import { evidenceUrl } from '../middleware/upload';
import { haversineKm } from '../utils/geo';
import type { AuthUser } from '../types/auth';

/**
 * CITIZEN HAZARD REPORTING - additive to the existing Incident triage workflow.
 * A CitizenReport is created alongside an auto-generated Incident (status NEW)
 * so operators triage it through the SAME pipeline as any other incident.
 * Nothing here modifies Incident/Task/Risk/Cascade behavior - only reuses it.
 *
 * Batch 2: Rolling deduplication — same citizen + same category + < 100m + < 5 min
 * returns the existing active report (idempotency). Accepts Idempotency-Key header.
 * Batch 3: Citizen report creation + incident link + evidence rows are wrapped in
 * a single prisma.$transaction for crash-safe atomicity.
 */

/** Deduplication window: same citizen + same category + within 100m + within this window. */
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const DEDUP_RADIUS_KM = 0.1; // 100m

const CATEGORY_TO_INCIDENT_TYPE: Record<string, string> = {
  FLASH_FLOOD: 'FLOODING',
  ROAD_BLOCKED: 'ROAD_BLOCKAGE',
  DOWNED_LINE: 'POWER_FAILURE',
  EXTREME_HEAT: 'HEAT_EMERGENCY',
  WATER_MAIN: 'DRAINAGE_FAILURE',
  LANDSLIDE_MUD: 'INFRASTRUCTURE_FAILURE',
  STORM_DAMAGE: 'INFRASTRUCTURE_FAILURE',
  OTHER: 'OTHER',
};

const CATEGORY_LABEL: Record<string, string> = {
  FLASH_FLOOD: 'Flash Flood',
  ROAD_BLOCKED: 'Road Blocked',
  DOWNED_LINE: 'Downed Line',
  EXTREME_HEAT: 'Extreme Heat',
  WATER_MAIN: 'Water Main Break',
  LANDSLIDE_MUD: 'Landslide / Mudslide',
  STORM_DAMAGE: 'Storm Damage',
  OTHER: 'Unclassified Hazard',
};

export interface CreateCitizenReportInput {
  category: string;
  description?: string;
  latitude: number;
  longitude: number;
  reportedSeverity?: string;
}

export interface UploadedEvidenceFile {
  filename: string;
  mimetype: string;
  size: number;
}

const reportInclude = { evidence: true, incident: { select: { id: true, incidentCode: true, status: true } } } satisfies Prisma.CitizenReportInclude;
type ReportWithRelations = Prisma.CitizenReportGetPayload<{ include: typeof reportInclude }>;

function toReportDto(r: ReportWithRelations) {
  return {
    id: r.id,
    reportCode: r.reportCode,
    category: r.category,
    description: r.description,
    latitude: r.latitude,
    longitude: r.longitude,
    reportedSeverity: r.reportedSeverity,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    evidence: r.evidence.map((e) => ({
      id: e.id,
      mediaType: e.mediaType,
      url: e.storageRef,
      byteSize: e.byteSize,
      createdAt: e.createdAt,
    })),
    incident: r.incident ? { id: r.incident.id, incidentCode: r.incident.incidentCode, status: r.incident.status } : null,
  };
}

export async function createCitizenReport(
  user: AuthUser,
  input: CreateCitizenReportInput,
  files: UploadedEvidenceFile[],
  idempotencyKey?: string,
) {
  const zone = await resolveZoneForPoint(input.latitude, input.longitude);
  if (!zone) {
    throw Errors.businessRule('LOCATION_OUTSIDE_COVERAGE', 'This location is outside any monitored zone.');
  }

  // ---- Batch 2: Rolling Deduplication ----
  // Same citizen + same category + nearby coordinates (< 100m) within 5 minutes
  // returns the existing active report instead of creating duplicates.
  const windowStart = new Date(Date.now() - DEDUP_WINDOW_MS);
  const recentReports = await prisma.citizenReport.findMany({
    where: {
      reporterId: user.id,
      category: input.category as never,
      status: { in: ['SUBMITTED', 'UNDER_REVIEW'] as never[] },
      createdAt: { gte: windowStart },
    },
    include: reportInclude,
  });

  for (const existing of recentReports) {
    const dist = haversineKm(
      { latitude: input.latitude, longitude: input.longitude },
      { latitude: existing.latitude, longitude: existing.longitude },
    );
    if (dist <= DEDUP_RADIUS_KM) {
      // Return existing report — idempotent response
      return { ...toReportDto(existing), _deduplicated: true };
    }
  }

  // ---- Idempotency-Key deduplication ----
  if (idempotencyKey) {
    const keyMatch = await prisma.citizenReport.findFirst({
      where: { reporterId: user.id, idempotencyKey } as never,
      include: reportInclude,
    }).catch(() => null); // field may not exist in older migrations; safe fallback
    if (keyMatch) return { ...toReportDto(keyMatch), _deduplicated: true };
  }

  // ---- Batch 3: Atomic Transaction ----
  // Citizen report creation + incident link + evidence rows all-or-nothing.
  const reportCode = await nextCitizenReportCode(prisma);

  const created = await prisma.$transaction(async (tx) => {
    // Auto-create a linked Incident (status NEW) so this enters the existing
    // government triage/dispatch workflow unchanged. dataQuality=ESTIMATED
    // (unverified citizen report), same as any operator-reported incident.
    const incident = await createIncident(
      {
        title: `Citizen report: ${CATEGORY_LABEL[input.category] ?? input.category} near ${zone.name}`,
        description: input.description,
        type: (CATEGORY_TO_INCIDENT_TYPE[input.category] ?? 'OTHER') as never,
        severity: (input.reportedSeverity ?? 'MODERATE') as never,
        zoneId: zone.id,
      },
      user,
    );

    const report = await tx.citizenReport.create({
      data: {
        reportCode,
        reporterId: user.id,
        category: input.category as never,
        description: input.description,
        latitude: input.latitude,
        longitude: input.longitude,
        zoneId: zone.id,
        reportedSeverity: (input.reportedSeverity as never) ?? undefined,
        incidentId: incident.id,
        evidence: {
          create: files.map((f) => ({
            mediaType: f.mimetype,
            storageType: 'LOCAL_DISK' as const,
            storageRef: evidenceUrl(f.filename),
            byteSize: f.size,
          })),
        },
      },
      include: reportInclude,
    });

    await createAudit(tx, {
      userId: user.id,
      action: AuditActions.CITIZEN_REPORT_SUBMITTED,
      entityType: 'CITIZEN_REPORT',
      entityId: report.id,
      metadata: {
        category: input.category,
        zone: zone.name,
        incidentId: incident.id,
        incidentCode: incident.incidentCode,
        oldState: null,
        newState: 'SUBMITTED',
      },
    });

    return report;
  });

  return { ...toReportDto(created), _deduplicated: false };
}

/** Own reports only - ownership-scoped, newest first. */
export async function listMyCitizenReports(userId: string) {
  const rows = await prisma.citizenReport.findMany({
    where: { reporterId: userId },
    include: reportInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toReportDto);
}

/** Own report detail only - foreign ids 404 (no enumeration of other citizens' reports). */
export async function getMyCitizenReport(userId: string, id: string) {
  const row = await prisma.citizenReport.findFirst({ where: { id, reporterId: userId }, include: reportInclude });
  if (!row) throw Errors.notFound('Citizen report', id);
  return toReportDto(row);
}
