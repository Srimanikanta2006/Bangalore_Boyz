import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { nextSosCode } from '../utils/ids';
import { AuditActions, recordAudit } from './audit.service';
import { createIncident } from './incident.service';
import { resolveZoneForPoint } from './zoneLookup.service';
import { enqueueDeliveryAttempts } from '../notifications/delivery.service';
import type { AuthUser } from '../types/auth';

/**
 * CITIZEN EMERGENCY SOS - additive to the existing Incident/Notification
 * pipeline. IMPORTANT: this creates an INTERNAL ClimateShield emergency event
 * visible to authorized operators. It does NOT contact real emergency
 * services (911/112/local dispatch) - there is no external integration.
 */

const THREAT_TO_INCIDENT_TYPE: Record<string, string> = {
  MEDICAL: 'MEDICAL_ACCESS',
  FIRE_RESCUE: 'OTHER',
  FLOOD_BOAT: 'FLOODING',
  HAZARD_GAS: 'INFRASTRUCTURE_FAILURE',
};

const THREAT_LABEL: Record<string, string> = {
  MEDICAL: 'Medical Emergency',
  FIRE_RESCUE: 'Fire & Rescue',
  FLOOD_BOAT: 'Flood / Water Rescue',
  HAZARD_GAS: 'Hazard Triage (Power/Gas)',
};

/** Government/dispatch roles notified on every SOS (best-effort; never blocks the SOS itself). */
const OPERATOR_ROLES = ['GOVERNMENT_OPERATOR', 'DISPATCHER', 'ADMIN'] as const;

export interface CreateSosInput {
  latitude: number;
  longitude: number;
  primaryThreat: string;
  peopleAffected?: number;
  note?: string;
  tags?: string[];
}

const sosInclude = { incident: { select: { id: true, incidentCode: true, status: true } } } satisfies Prisma.SosEventInclude;
type SosWithRelations = Prisma.SosEventGetPayload<{ include: typeof sosInclude }>;

function toSosDto(r: SosWithRelations) {
  return {
    id: r.id,
    sosCode: r.sosCode,
    latitude: r.latitude,
    longitude: r.longitude,
    primaryThreat: r.primaryThreat,
    secondaryConditions: r.secondaryConditions,
    peopleAffected: r.peopleAffected,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    incident: r.incident ? { id: r.incident.id, incidentCode: r.incident.incidentCode, status: r.incident.status } : null,
    disclaimer:
      'This alert notifies ClimateShield operators only. It does NOT dial 911/112 or any external emergency service - call local emergency services directly for life-threatening situations if possible.',
  };
}

export async function createSosEvent(user: AuthUser, input: CreateSosInput) {
  const zone = await resolveZoneForPoint(input.latitude, input.longitude);
  if (!zone) {
    throw Errors.businessRule('LOCATION_OUTSIDE_COVERAGE', 'This location is outside any monitored zone.');
  }

  // SOS is always CRITICAL severity (life-safety) and auto-creates a linked Incident.
  const incident = await createIncident(
    {
      title: `SOS: ${THREAT_LABEL[input.primaryThreat] ?? input.primaryThreat} near ${zone.name}`,
      description: input.note,
      type: (THREAT_TO_INCIDENT_TYPE[input.primaryThreat] ?? 'OTHER') as never,
      severity: 'CRITICAL' as never,
      zoneId: zone.id,
    },
    user,
  );

  const sosCode = await nextSosCode(prisma);
  const created = await prisma.sosEvent.create({
    data: {
      sosCode,
      requesterId: user.id,
      latitude: input.latitude,
      longitude: input.longitude,
      zoneId: zone.id,
      primaryThreat: input.primaryThreat as never,
      secondaryConditions: (input.tags as unknown as Prisma.InputJsonValue) ?? undefined,
      peopleAffected: input.peopleAffected,
      note: input.note,
      incidentId: incident.id,
    },
    include: sosInclude,
  });

  // Best-effort operator notification fan-out; failures never block the SOS response.
  try {
    const operators = await prisma.user.findMany({
      where: { role: { in: OPERATOR_ROLES as unknown as never[] }, isActive: true },
      select: { id: true },
    });
    if (operators.length > 0) {
      // Individual creates (not createMany) so we get real ids back to kick off
      // outbox delivery attempts per notification - fine at demo-scale operator counts.
      const created = await Promise.all(
        operators.map((o) =>
          prisma.notification.create({
            data: {
              userId: o.id,
              type: 'SOS_ALERT',
              severity: 'CRITICAL',
              title: `SOS ${sosCode}: ${THREAT_LABEL[input.primaryThreat] ?? input.primaryThreat}`,
              message: `Citizen SOS near ${zone.name} (${incident.incidentCode}). Internal alert only - no external dispatch integration.`,
            },
            select: { id: true },
          }),
        ),
      );
      enqueueDeliveryAttempts(created.map((n) => n.id));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: 'error', scope: 'sos', message: 'Failed to notify operators', detail: err instanceof Error ? err.message : String(err) }));
  }

  await recordAudit({
    userId: user.id,
    action: AuditActions.CITIZEN_SOS_SUBMITTED,
    entityType: 'SOS_EVENT',
    entityId: created.id,
    metadata: { primaryThreat: input.primaryThreat, zone: zone.name, incidentId: incident.id, incidentCode: incident.incidentCode },
  });

  return toSosDto(created);
}

/** Own SOS history only, newest first. */
export async function listMySosEvents(userId: string) {
  const rows = await prisma.sosEvent.findMany({ where: { requesterId: userId }, include: sosInclude, orderBy: { createdAt: 'desc' } });
  return rows.map(toSosDto);
}
