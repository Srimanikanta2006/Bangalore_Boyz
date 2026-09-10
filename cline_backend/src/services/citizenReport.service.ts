import fs from 'node:fs/promises';
import path from 'node:path';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { nextCitizenReportCode } from '../utils/ids';
import { AuditActions, recordAudit } from './audit.service';
import { createIncident } from './incident.service';
import { resolveZoneForPoint } from './zoneLookup.service';
import { evidenceUrl, EVIDENCE_DIR } from '../middleware/upload';
import { triagePhotoWithGeminiOrNull } from '../ai/photoTriageProvider';
import type { AuthUser } from '../types/auth';

/**
 * CITIZEN HAZARD REPORTING - additive to the existing Incident triage workflow.
 * A CitizenReport is created alongside an auto-generated Incident (status NEW)
 * so operators triage it through the SAME pipeline as any other incident.
 * Nothing here modifies Incident/Task/Risk/Cascade behavior - only reuses it.
 */

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
      // Best-effort Gemini VISION triage - null unless it actually ran and succeeded.
      // Always non-authoritative: an additional signal for the operator, never a
      // final determination and never overrides the citizen's own category.
      ai: e.aiProvider
        ? {
            provider: e.aiProvider,
            waterDepthEstimate: e.aiWaterDepthEstimate,
            caption: e.aiCaption,
            confidence: e.aiConfidence,
            visibleHazards: (e.aiVisibleHazards as string[] | null) ?? [],
          }
        : null,
    })),
    incident: r.incident ? { id: r.incident.id, incidentCode: r.incident.incidentCode, status: r.incident.status } : null,
  };
}

export async function createCitizenReport(
  user: AuthUser,
  input: CreateCitizenReportInput,
  files: UploadedEvidenceFile[],
) {
  const zone = await resolveZoneForPoint(input.latitude, input.longitude);
  if (!zone) {
    throw Errors.businessRule('LOCATION_OUTSIDE_COVERAGE', 'This location is outside any monitored zone.');
  }

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

  const reportCode = await nextCitizenReportCode(prisma);
  const created = await prisma.citizenReport.create({
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

  await recordAudit({
    userId: user.id,
    action: AuditActions.CITIZEN_REPORT_SUBMITTED,
    entityType: 'CITIZEN_REPORT',
    entityId: created.id,
    metadata: { category: input.category, zone: zone.name, incidentId: incident.id, incidentCode: incident.incidentCode },
  });

  // Best-effort Gemini VISION triage on the first photo only (bounds latency/cost;
  // most reports have a single photo). Never blocks or fails the submission -
  // if GEMINI_API_KEY is unset or the call fails for any reason, this is a no-op
  // and the report is returned exactly as already created above.
  const firstEvidence = created.evidence[0];
  if (firstEvidence) {
    const triaged = await triageEvidencePhoto(firstEvidence.id, firstEvidence.storageRef);
    if (triaged) {
      const refreshed = await prisma.citizenReport.findUnique({ where: { id: created.id }, include: reportInclude });
      if (refreshed) return toReportDto(refreshed);
    }
  }

  return toReportDto(created);
}

/** Reads the stored file, calls Gemini vision, and persists the result. Returns true if it updated anything. */
async function triageEvidencePhoto(evidenceId: string, storageRef: string): Promise<boolean> {
  try {
    const filename = path.basename(storageRef);
    const filePath = path.join(EVIDENCE_DIR, filename);
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    const result = await triagePhotoWithGeminiOrNull(buffer.toString('base64'), mimeType);
    if (!result) return false;

    await prisma.reportEvidence.update({
      where: { id: evidenceId },
      data: {
        aiProvider: 'gemini',
        aiWaterDepthEstimate: result.response.waterDepthEstimate,
        aiCaption: result.response.caption,
        aiConfidence: result.response.confidence,
        aiVisibleHazards: result.response.visibleHazards as never,
      },
    });
    return true;
  } catch {
    // Never let a photo-triage failure affect report submission.
    return false;
  }
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
