#!/usr/bin/env bash
# ClimateShield - end-to-end smoke test of the critical Government journey
# against a RUNNING server. Usage: ./scripts/smoke.sh [baseUrl]
set -euo pipefail
BASE="${1:-http://localhost:4000}"
EMAIL="${SMOKE_EMAIL:-government@climateshield.demo}"
PASSWORD="${SMOKE_PASSWORD:-DemoGov@2024}"
UNIT="${SMOKE_UNIT:-unit_pump_1}"

say() { printf '\n==> %s\n' "$1"; }
readjson() {
  node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf8')); console.log(JSON.stringify($1));"
}

say "GET /api/health"
curl -s "$BASE/api/health"; echo

say "POST /api/auth/login (government operator)"
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | node -e "const d = JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.data.token)")
echo "token acquired (${TOKEN:0:24}...)"
AUTH="Authorization: Bearer $TOKEN"

say "GET /api/government/overview"
curl -s "$BASE/api/government/overview" -H "$AUTH" | readjson \
  '({resilienceIndex: d.data.resilienceIndex, level: d.data.resilienceLevel, activeThreats: d.data.activeThreats, monitoredZones: d.data.monitoredZones, activeIncidents: d.data.activeIncidents, criticalIncidents: d.data.criticalIncidents, readiness: d.data.resourceReadiness.percent, precipitation: d.data.precipitation})'

say "GET /api/response-center"
curl -s "$BASE/api/response-center" -H "$AUTH" | readjson 'd.data.summary'

say "GET /api/incidents/INC-204 (detail + cascade + available units)"
curl -s "$BASE/api/incidents/INC-204" -H "$AUTH" | readjson \
  '({code: d.data.incident.incidentCode, severity: d.data.incident.severity, zone: d.data.incident.zone.name, asset: d.data.incident.primaryAsset.assetCode, cascade: d.data.cascade.nodes.map((n) => n.assetCode + ":" + n.impactType), availableUnits: d.data.availableUnits.length})'

say "POST /api/incidents/INC-204/dispatch (unit $UNIT)"
TASK=$(curl -s -X POST "$BASE/api/incidents/INC-204/dispatch" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"unitId\":\"$UNIT\"}")
echo "$TASK" | readjson '({task: d.data.task.taskCode, status: d.data.task.status, unit: d.data.unit.callsign, incidentStatus: d.data.incident.status})'
TASK_CODE=$(echo "$TASK" | node -e "const d = JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.data.task.taskCode)")

say "duplicate dispatch -> expect 409 DUPLICATE_DISPATCH"
curl -s -o /dev/null -w 'HTTP %{http_code} | ' -X POST "$BASE/api/incidents/INC-204/dispatch" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"unitId\":\"$UNIT\"}"
curl -s -X POST "$BASE/api/incidents/INC-204/dispatch" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"unitId\":\"$UNIT\"}" \
  | node -e "const d = JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.error.code)"

say "invalid task transition ASSIGNED->COMPLETED -> expect 422"
curl -s -o /dev/null -w 'HTTP %{http_code}\n' -X PATCH "$BASE/api/tasks/$TASK_CODE/status" -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"COMPLETED"}'

say "task lifecycle: ACKNOWLEDGED -> IN_PROGRESS -> COMPLETED -> verify"
for S in ACKNOWLEDGED IN_PROGRESS COMPLETED; do
  curl -s -o /dev/null -w "  $S -> HTTP %{http_code}\n" -X PATCH "$BASE/api/tasks/$TASK_CODE/status" -H "$AUTH" -H 'Content-Type: application/json' -d "{\"status\":\"$S\"}"
done
curl -s -o /dev/null -w "  VERIFY -> HTTP %{http_code}\n" -X POST "$BASE/api/tasks/$TASK_CODE/verify" -H "$AUTH" -H 'Content-Type: application/json' -d '{}'

say "GET /api/tasks/$TASK_CODE/history"
curl -s "$BASE/api/tasks/$TASK_CODE/history" -H "$AUTH" | readjson 'd.data.history.map((h) => h.toStatus)'

say "GET /api/zones/EB/cascade"
curl -s "$BASE/api/zones/EB/cascade" -H "$AUTH" | readjson \
  '({risk: d.data.riskScore, level: d.data.riskLevel, cascade: d.data.cascade.map((c) => c.asset + ":" + c.impact), impact: d.data.impact})'

say "POST /api/zones/EB/response-plan"
curl -s -X POST "$BASE/api/zones/EB/response-plan" -H "$AUTH" | readjson \
  '({status: d.data.status, priority: d.data.priority, units: d.data.recommendedUnits.map((u) => u.callsign), actions: d.data.recommendedActions.length})'

say "POST /api/simulations (spec FLASH_FLOOD example)"
curl -s -X POST "$BASE/api/simulations" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"scenarioType":"FLASH_FLOOD","rainfallRate":65,"stormDuration":4.5,"drainageThroughput":75,"tidalSurge":1.8,"temperature":28.4}' \
  | readjson '({status: d.data.status, worstZone: d.data.summary.worstZone, maxRisk: d.data.summary.maxRiskScore, populationExposed: d.data.summary.totalPopulationExposed, damageUsd: d.data.summary.totalDamageUsd})'

say "security: no token -> expect 401"
curl -s -o /dev/null -w 'HTTP %{http_code}\n' "$BASE/api/incidents"

say "SMOKE TEST COMPLETE"
