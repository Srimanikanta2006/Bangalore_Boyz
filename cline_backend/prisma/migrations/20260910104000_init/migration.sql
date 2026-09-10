-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GOVERNMENT_OPERATOR', 'DISPATCHER', 'FIELD_OPERATOR', 'ANALYST');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('PUBLIC_WORKS', 'FIRE_RESCUE', 'EMS', 'POLICE', 'UTILITIES', 'WATER', 'TRANSPORT', 'EMERGENCY_MANAGEMENT');

-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'STANDBY', 'DEGRADED', 'OFFLINE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('HOSPITAL', 'SUBSTATION', 'PUMPING_STATION', 'ROAD', 'BRIDGE', 'EVACUATION_SHELTER', 'COOLING_CENTER', 'DRAIN', 'WATER_TREATMENT', 'GENERATOR', 'FIRE_STATION', 'AMBULANCE_GATE', 'OTHER');

-- CreateEnum
CREATE TYPE "Criticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'AT_RISK', 'COMPROMISED', 'OFFLINE');

-- CreateEnum
CREATE TYPE "HazardType" AS ENUM ('FLOOD', 'FLASH_FLOOD', 'EXTREME_HEAT', 'STORM', 'HIGH_WIND', 'DRAINAGE_OVERFLOW', 'POWER_FAILURE', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HazardStatus" AS ENUM ('ACTIVE', 'MONITORING', 'RESOLVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "HazardSource" AS ENUM ('SIMULATOR', 'WEATHER_API', 'OPERATOR', 'SENSOR', 'HISTORICAL');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('FLOODING', 'INFRASTRUCTURE_FAILURE', 'POWER_FAILURE', 'ROAD_BLOCKAGE', 'HEAT_EMERGENCY', 'DRAINAGE_FAILURE', 'MEDICAL_ACCESS', 'EVACUATION', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('FIRE_RESCUE', 'EMS', 'PUBLIC_WORKS', 'POLICE', 'UTILITY', 'PUMP_CREW', 'BARRIER_CREW', 'HEAVY_EQUIPMENT', 'MUTUAL_AID');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('POWERED_BY', 'DRAINS_INTO', 'PROVIDES_ACCESS_TO', 'SUPPLIES_WATER_TO', 'SERVED_BY', 'SUPPORTS', 'OTHER');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('ATMOSPHERIC_RIVER', 'FLASH_FLOOD', 'EXTREME_HEAT', 'STORM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CascadeImpactType" AS ENUM ('INUNDATED', 'OVERWHELMED', 'PUMP_FAILURE', 'POWER_LOSS', 'POWER_AT_RISK', 'ON_BACKUP_POWER', 'BACKUP_ENGAGED', 'ACCESS_BLOCKED', 'AMBULANCE_DELAYED', 'THERMAL_OVERLOAD', 'THERMAL_STRESS', 'OVERCAPACITY', 'DEGRADED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GOVERNMENT_OPERATOR',
    "departmentId" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DepartmentType" NOT NULL,
    "contactPhone" TEXT,
    "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "boundaryGeoJson" JSONB,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MODERATE',
    "population" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfrastructureAsset" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "zoneId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "criticality" "Criticality" NOT NULL DEFAULT 'MEDIUM',
    "vulnerability" INTEGER NOT NULL DEFAULT 50,
    "operationalStatus" "OperationalStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfrastructureAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hazard" (
    "id" TEXT NOT NULL,
    "type" "HazardType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "zoneId" TEXT NOT NULL,
    "rainfallRate" DOUBLE PRECISION,
    "waterDepth" DOUBLE PRECISION,
    "flowVelocity" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "windSpeed" DOUBLE PRECISION,
    "durationMinutes" INTEGER,
    "source" "HazardSource" NOT NULL DEFAULT 'OPERATOR',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "HazardStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hazard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "IncidentType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'NEW',
    "zoneId" TEXT NOT NULL,
    "hazardId" TEXT,
    "primaryAssetId" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "slaDeadline" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "teamSize" INTEGER NOT NULL DEFAULT 4,
    "capacity" INTEGER,
    "specialization" TEXT,
    "etaMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponseUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "incidentId" TEXT,
    "assetId" TEXT,
    "assignedUnitId" TEXT,
    "assignedDepartmentId" TEXT,
    "createdById" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'ASSIGNED',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "slaDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskStatusHistory" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fromStatus" "TaskStatus",
    "toStatus" "TaskStatus" NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DependencyEdge" (
    "id" TEXT NOT NULL,
    "sourceAssetId" TEXT NOT NULL,
    "targetAssetId" TEXT NOT NULL,
    "dependencyType" "DependencyType" NOT NULL DEFAULT 'SUPPORTS',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DependencyEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "hazardId" TEXT,
    "score" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "vulnerabilityComponent" DOUBLE PRECISION NOT NULL,
    "hazardComponent" DOUBLE PRECISION NOT NULL,
    "historicalComponent" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CascadeEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "rootAssetId" TEXT NOT NULL,
    "affectedAssetId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "impactType" "CascadeImpactType" NOT NULL DEFAULT 'DEGRADED',
    "impactScore" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CascadeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryReading" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "zoneId" TEXT NOT NULL,
    "hazardType" "HazardType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "source" TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO',

    CONSTRAINT "HistoricalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotspot" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "hazardType" "HazardType" NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "severityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recurrenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastOccurredAt" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "Hotspot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scenarioType" "ScenarioType" NOT NULL,
    "parameters" JSONB NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationResult" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "zoneId" TEXT,
    "riskScore" INTEGER NOT NULL,
    "affectedAssets" INTEGER NOT NULL,
    "affectedRoads" INTEGER NOT NULL,
    "estimatedPopulation" INTEGER NOT NULL,
    "estimatedDamage" JSONB,
    "recommendedActions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_type_idx" ON "Department"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_code_key" ON "Zone"("code");

-- CreateIndex
CREATE INDEX "Zone_riskLevel_idx" ON "Zone"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "InfrastructureAsset_assetCode_key" ON "InfrastructureAsset"("assetCode");

-- CreateIndex
CREATE INDEX "InfrastructureAsset_zoneId_idx" ON "InfrastructureAsset"("zoneId");

-- CreateIndex
CREATE INDEX "InfrastructureAsset_type_idx" ON "InfrastructureAsset"("type");

-- CreateIndex
CREATE INDEX "InfrastructureAsset_operationalStatus_idx" ON "InfrastructureAsset"("operationalStatus");

-- CreateIndex
CREATE INDEX "InfrastructureAsset_criticality_idx" ON "InfrastructureAsset"("criticality");

-- CreateIndex
CREATE INDEX "Hazard_zoneId_idx" ON "Hazard"("zoneId");

-- CreateIndex
CREATE INDEX "Hazard_type_idx" ON "Hazard"("type");

-- CreateIndex
CREATE INDEX "Hazard_severity_idx" ON "Hazard"("severity");

-- CreateIndex
CREATE INDEX "Hazard_status_idx" ON "Hazard"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_incidentCode_key" ON "Incident"("incidentCode");

-- CreateIndex
CREATE INDEX "Incident_incidentCode_idx" ON "Incident"("incidentCode");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_zoneId_idx" ON "Incident"("zoneId");

-- CreateIndex
CREATE INDEX "Incident_createdAt_idx" ON "Incident"("createdAt");

-- CreateIndex
CREATE INDEX "Incident_hazardId_idx" ON "Incident"("hazardId");

-- CreateIndex
CREATE INDEX "Incident_primaryAssetId_idx" ON "Incident"("primaryAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseUnit_callsign_key" ON "ResponseUnit"("callsign");

-- CreateIndex
CREATE INDEX "ResponseUnit_departmentId_idx" ON "ResponseUnit"("departmentId");

-- CreateIndex
CREATE INDEX "ResponseUnit_status_idx" ON "ResponseUnit"("status");

-- CreateIndex
CREATE INDEX "ResponseUnit_type_idx" ON "ResponseUnit"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Task_taskCode_key" ON "Task"("taskCode");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_incidentId_idx" ON "Task"("incidentId");

-- CreateIndex
CREATE INDEX "Task_assignedUnitId_idx" ON "Task"("assignedUnitId");

-- CreateIndex
CREATE INDEX "Task_assetId_idx" ON "Task"("assetId");

-- CreateIndex
CREATE INDEX "Task_assignedDepartmentId_idx" ON "Task"("assignedDepartmentId");

-- CreateIndex
CREATE INDEX "TaskStatusHistory_taskId_idx" ON "TaskStatusHistory"("taskId");

-- CreateIndex
CREATE INDEX "TaskStatusHistory_changedById_idx" ON "TaskStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "DependencyEdge_sourceAssetId_idx" ON "DependencyEdge"("sourceAssetId");

-- CreateIndex
CREATE INDEX "DependencyEdge_targetAssetId_idx" ON "DependencyEdge"("targetAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "DependencyEdge_sourceAssetId_targetAssetId_dependencyType_key" ON "DependencyEdge"("sourceAssetId", "targetAssetId", "dependencyType");

-- CreateIndex
CREATE INDEX "RiskScore_assetId_idx" ON "RiskScore"("assetId");

-- CreateIndex
CREATE INDEX "RiskScore_hazardId_idx" ON "RiskScore"("hazardId");

-- CreateIndex
CREATE INDEX "RiskScore_calculatedAt_idx" ON "RiskScore"("calculatedAt");

-- CreateIndex
CREATE INDEX "CascadeEvent_incidentId_idx" ON "CascadeEvent"("incidentId");

-- CreateIndex
CREATE INDEX "CascadeEvent_rootAssetId_idx" ON "CascadeEvent"("rootAssetId");

-- CreateIndex
CREATE INDEX "CascadeEvent_affectedAssetId_idx" ON "CascadeEvent"("affectedAssetId");

-- CreateIndex
CREATE INDEX "TelemetryReading_assetId_timestamp_idx" ON "TelemetryReading"("assetId", "timestamp");

-- CreateIndex
CREATE INDEX "TelemetryReading_metric_timestamp_idx" ON "TelemetryReading"("metric", "timestamp");

-- CreateIndex
CREATE INDEX "HistoricalEvent_zoneId_idx" ON "HistoricalEvent"("zoneId");

-- CreateIndex
CREATE INDEX "HistoricalEvent_hazardType_idx" ON "HistoricalEvent"("hazardType");

-- CreateIndex
CREATE INDEX "HistoricalEvent_occurredAt_idx" ON "HistoricalEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "HistoricalEvent_assetId_idx" ON "HistoricalEvent"("assetId");

-- CreateIndex
CREATE INDEX "Hotspot_zoneId_idx" ON "Hotspot"("zoneId");

-- CreateIndex
CREATE INDEX "Hotspot_hazardType_idx" ON "Hotspot"("hazardType");

-- CreateIndex
CREATE INDEX "Simulation_scenarioType_idx" ON "Simulation"("scenarioType");

-- CreateIndex
CREATE INDEX "Simulation_status_idx" ON "Simulation"("status");

-- CreateIndex
CREATE INDEX "SimulationResult_simulationId_idx" ON "SimulationResult"("simulationId");

-- CreateIndex
CREATE INDEX "SimulationResult_zoneId_idx" ON "SimulationResult"("zoneId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfrastructureAsset" ADD CONSTRAINT "InfrastructureAsset_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hazard" ADD CONSTRAINT "Hazard_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "Hazard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_primaryAssetId_fkey" FOREIGN KEY ("primaryAssetId") REFERENCES "InfrastructureAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseUnit" ADD CONSTRAINT "ResponseUnit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InfrastructureAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedUnitId_fkey" FOREIGN KEY ("assignedUnitId") REFERENCES "ResponseUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedDepartmentId_fkey" FOREIGN KEY ("assignedDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependencyEdge" ADD CONSTRAINT "DependencyEdge_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "InfrastructureAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependencyEdge" ADD CONSTRAINT "DependencyEdge_targetAssetId_fkey" FOREIGN KEY ("targetAssetId") REFERENCES "InfrastructureAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InfrastructureAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "Hazard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CascadeEvent" ADD CONSTRAINT "CascadeEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CascadeEvent" ADD CONSTRAINT "CascadeEvent_rootAssetId_fkey" FOREIGN KEY ("rootAssetId") REFERENCES "InfrastructureAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CascadeEvent" ADD CONSTRAINT "CascadeEvent_affectedAssetId_fkey" FOREIGN KEY ("affectedAssetId") REFERENCES "InfrastructureAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryReading" ADD CONSTRAINT "TelemetryReading_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InfrastructureAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalEvent" ADD CONSTRAINT "HistoricalEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InfrastructureAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalEvent" ADD CONSTRAINT "HistoricalEvent_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotspot" ADD CONSTRAINT "Hotspot_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResult" ADD CONSTRAINT "SimulationResult_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResult" ADD CONSTRAINT "SimulationResult_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
