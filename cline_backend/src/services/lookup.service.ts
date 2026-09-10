import type { DbClient } from '../db/prisma';
import { Errors } from '../utils/errors';

/** Shared id-or-human-code resolvers used across services. */

export async function findIncidentByIdOrCode(client: DbClient, key: string) {
  const incident = await client.incident.findFirst({ where: { OR: [{ id: key }, { incidentCode: key }] } });
  if (!incident) throw Errors.notFound('Incident', key);
  return incident;
}

export async function findAssetByIdOrCode(client: DbClient, key: string) {
  const asset = await client.infrastructureAsset.findFirst({ where: { OR: [{ id: key }, { assetCode: key }] } });
  if (!asset) throw Errors.notFound('Infrastructure asset', key);
  return asset;
}

export async function findUnitByIdOrCallsign(client: DbClient, key: string) {
  const unit = await client.responseUnit.findFirst({ where: { OR: [{ id: key }, { callsign: key }] } });
  if (!unit) throw Errors.notFound('Response unit', key);
  return unit;
}

export async function findZoneByIdOrCode(client: DbClient, key: string) {
  const zone = await client.zone.findFirst({ where: { OR: [{ id: key }, { code: key }] } });
  if (!zone) throw Errors.notFound('Zone', key);
  return zone;
}

export async function findDepartmentByIdOrCode(client: DbClient, key: string) {
  const department = await client.department.findFirst({ where: { OR: [{ id: key }, { code: key }] } });
  if (!department) throw Errors.notFound('Department', key);
  return department;
}
