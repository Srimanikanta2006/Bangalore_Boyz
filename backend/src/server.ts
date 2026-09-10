import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { explainWithGeminiOrFallback } from "./ai/geminiProvider";
import {
  computeHotspots,
  VALID_HAZARDS,
  validateHistoricalIncidentsDetailed,
  validateHotspotConfig,
} from "./ai/hotspotIntelligence";
import { SAMPLE_HISTORICAL_INCIDENTS } from "./ai/hotspotSampleData";
import type { HazardType } from "./ai/schemas";
import { toExplainRequest } from "./engine/explainAdapter";
import { simulateHazard } from "./engine/hazardSimulator";
import { PILOT_GRAPH } from "./engine/pilotGraph";
import { findSafeRoute } from "./engine/routeEngine";
import { getCascade, getSnapshot, saveRoute, saveSnapshot } from "./engine/store";

const PORT = Number(process.env.PORT ?? 3001);

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function snapshotPayload(snapshot: NonNullable<ReturnType<typeof getSnapshot>>) {
  return {
    ...snapshot,
    explainRequest: toExplainRequest(snapshot, PILOT_GRAPH),
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, { ok: true, role: "climateshield-engine" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/graph") {
      json(res, 200, {
        zone: { id: PILOT_GRAPH.zoneId, name: PILOT_GRAPH.zoneName },
        assets: PILOT_GRAPH.assets,
        edges: PILOT_GRAPH.edges,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/hazard/simulate") {
      const raw = await readBody(req);
      const body = raw ? (JSON.parse(raw) as { rainfallMmPerHour?: number }) : {};
      const rainfall = body.rainfallMmPerHour;
      if (typeof rainfall !== "number") {
        json(res, 400, { error: "rainfallMmPerHour must be a number" });
        return;
      }
      const snapshot = simulateHazard(rainfall);
      saveSnapshot(snapshot);
      json(res, 200, snapshotPayload(snapshot));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/risk/current") {
      const snapshot = getSnapshot();
      if (!snapshot) {
        json(res, 404, { error: "No simulation yet. POST /api/hazard/simulate first." });
        return;
      }
      json(res, 200, {
        incidentId: snapshot.incidentId,
        hazard: snapshot.hazard,
        risks: snapshot.risks,
      });
      return;
    }

    const cascadeMatch = url.pathname.match(/^\/api\/cascade\/([^/]+)$/);
    if (req.method === "GET" && cascadeMatch) {
      const event = getCascade(cascadeMatch[1]);
      if (!event) {
        json(res, 404, { error: `Unknown cascade ${cascadeMatch[1]}` });
        return;
      }
      json(res, 200, event);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/explain-payload") {
      const snapshot = getSnapshot();
      if (!snapshot) {
        json(res, 404, { error: "No simulation yet. POST /api/hazard/simulate first." });
        return;
      }
      json(res, 200, toExplainRequest(snapshot, PILOT_GRAPH));
      return;
    }

    // POST /api/explain - runs ExplainRequest through Gemini (with deterministic fallback)
    // Requires a prior POST /api/hazard/simulate to have been called first, or passes rainfall in body.
    if (req.method === "POST" && url.pathname === "/api/explain") {
      const raw = await readBody(req);
      let snapshot = getSnapshot();

      // Allow triggering a fresh simulation in the same request if rainfall provided
      if (raw) {
        try {
          const body = JSON.parse(raw) as { rainfallMmPerHour?: number };
          if (typeof body.rainfallMmPerHour === "number") {
            snapshot = simulateHazard(body.rainfallMmPerHour);
            saveSnapshot(snapshot);
          }
        } catch {
          // ignore malformed body if not json
        }
      }

      if (!snapshot) {
        json(res, 404, {
          error: "No simulation yet. POST /api/hazard/simulate first, or pass rainfallMmPerHour in this request body.",
        });
        return;
      }

      const explainRequest = toExplainRequest(snapshot, PILOT_GRAPH);
      const result = await explainWithGeminiOrFallback(explainRequest);

      json(res, 200, {
        incidentId: snapshot.incidentId,
        provider: result.usedFallback ? "fallback" : "gemini",
        model: result.modelUsed ?? null,
        usedFallback: result.usedFallback,
        fallbackReason: result.fallbackReason ?? null,
        explanation: result.response,
      });
      return;
    }

    // GET /api/hotspots - returns recurring historical climate risk hotspots
    // Query params: ?hazardType=flood&minScore=50&assetId=D07
    if (req.method === "GET" && url.pathname === "/api/hotspots") {
      const hazardParam = url.searchParams.get("hazardType");
      const minScoreParam = url.searchParams.get("minScore");
      const assetFilter = url.searchParams.get("assetId");

      if (hazardParam && !VALID_HAZARDS.includes(hazardParam as HazardType)) {
        json(res, 400, {
          error: `Invalid hazardType '${hazardParam}'. Allowed: ${VALID_HAZARDS.join(", ")}`,
        });
        return;
      }

      let minScore: number | undefined;
      if (minScoreParam !== null) {
        minScore = Number(minScoreParam);
        if (Number.isNaN(minScore) || minScore < 0 || minScore > 100) {
          json(res, 400, { error: "minScore must be a number between 0 and 100." });
          return;
        }
      }

      let hotspots = computeHotspots(SAMPLE_HISTORICAL_INCIDENTS, { minRecurrenceScore: minScore });

      if (hazardParam) {
        hotspots = hotspots.filter((h) => h.hazardType === hazardParam);
      }
      if (assetFilter) {
        hotspots = hotspots.filter((h) => h.assetId.toLowerCase() === assetFilter.toLowerCase());
      }

      json(res, 200, {
        totalHotspots: hotspots.length,
        hotspots,
      });
      return;
    }

    // POST /api/hotspots/analyze - computes hotspots from dynamically supplied historical incidents
    // Returns full validation summary, rejections list, and computed hotspots
    if (req.method === "POST" && url.pathname === "/api/hotspots/analyze") {
      const raw = await readBody(req);
      let body: Record<string, unknown> = {};
      try {
        body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        json(res, 400, { error: "Request body must be valid JSON." });
        return;
      }

      const incidentsInput = Array.isArray(body.incidents) ? body.incidents : [];
      const configValidation = validateHotspotConfig(body.config ?? {
        minIncidentCount: typeof body.minIncidentCount === "number" ? body.minIncidentCount : undefined,
        minRecurrenceScore: typeof body.minRecurrenceScore === "number" ? body.minRecurrenceScore : undefined,
        halfLifeDays: typeof body.halfLifeDays === "number" ? body.halfLifeDays : undefined,
      });

      if (!configValidation.valid) {
        json(res, 400, {
          error: "Invalid hotspot configuration.",
          details: configValidation.errors,
        });
        return;
      }

      const { valid, rejections } = validateHistoricalIncidentsDetailed(incidentsInput);
      const hotspots = computeHotspots(valid, configValidation.config);

      json(res, 200, {
        totalReceived: incidentsInput.length,
        validCount: valid.length,
        rejectedCount: rejections.length,
        rejections,
        totalHotspots: hotspots.length,
        hotspots,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/route/safe") {
      const from = url.searchParams.get("from") ?? "ST01";
      const to = url.searchParams.get("to") ?? "H01";
      const snapshot = getSnapshot();
      const risks = snapshot?.risks ?? [];
      const route = findSafeRoute(PILOT_GRAPH, risks, from, to);
      if (!route) {
        json(res, 404, { error: `No route from ${from} to ${to}` });
        return;
      }
      saveRoute(route);
      json(res, 200, route);
      return;
    }

    // --- RESCUE API ENDPOINTS ---
    if (req.method === "GET" && url.pathname === "/api/rescue/missions") {
      json(res, 200, {
        success: true,
        data: {
          items: [
            {
              id: "MSN-402",
              title: "Tactical Extraction — Substation #09",
              status: "IN_PROGRESS",
              priority: "CRITICAL",
              unitCallsign: "EM-MA1",
              targetSector: "Sector 04-B (Midtown)",
              etaMinutes: 14,
              description: "Deploy barrier teams and secure high-capacity pump bypass."
            },
            {
              id: "MSN-388",
              "title": "Arterial R24 Barrier Placement",
              status: "ASSIGNED",
              priority: "HIGH",
              unitCallsign: "PW-BAR-1",
              targetSector: "East Basin Drainage Corridor",
              etaMinutes: 22,
              description: "Erect water baffles to divert overflow away from hospital access road."
            }
          ]
        }
      });
      return;
    }

    const rescueMissionMatch = url.pathname.match(/^\/api\/rescue\/missions\/([^/]+)$/);
    if (req.method === "GET" && rescueMissionMatch) {
      json(res, 200, {
        success: true,
        data: {
          id: rescueMissionMatch[1],
          title: "Tactical Extraction — Substation #09",
          status: "IN_PROGRESS",
          priority: "CRITICAL",
          unitCallsign: "EM-MA1",
          targetSector: "Sector 04-B (Midtown)",
          etaMinutes: 14,
          hazardSeverity: "HIGH",
          equipmentManifest: ["High-Capacity Mobile Pump", "Abrasive Barrier Kit", "Submersible Telemetry Sensor Array"],
          description: "Deploy barrier teams and secure high-capacity pump bypass."
        }
      });
      return;
    }

    const rescueStatusMatch = url.pathname.match(/^\/api\/rescue\/missions\/([^/]+)\/status$/);
    if (req.method === "POST" && rescueStatusMatch) {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      json(res, 200, {
        success: true,
        data: {
          missionId: rescueStatusMatch[1],
          status: body.status || "IN_PROGRESS",
          updatedAt: new Date().toISOString(),
          message: "Rescue mission status updated successfully."
        }
      });
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/rescue/navigation/")) {
      json(res, 200, {
        success: true,
        data: {
          missionId: "MSN-402",
          currentPosition: [13.062, 80.275],
          targetPosition: [13.087, 80.291],
          waterDepthMm: 450,
          safePassable: true,
          routePath: ["Checkpoint Alpha", "Highridge Bypass", "Substation #09 Gate A"],
          etaText: "14 min remaining"
        }
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/rescue/command-console") {
      json(res, 200, {
        success: true,
        data: {
          activeMissions: 2,
          unitsDeployed: 6,
          tacticalAlerts: ["Water depth at R24 approaching 0.5m", "Substation #09 thermal threshold warning"],
          satLinkStatus: "ONLINE"
        }
      });
      return;
    }

    // --- CITIZEN API ENDPOINTS ---
    if (req.method === "GET" && url.pathname === "/api/citizen/alerts") {
      json(res, 200, {
        success: true,
        data: {
          items: [
            {
              id: "ALT-001",
              title: "Flash Flood Watch — East Basin & Midtown",
              severity: "CRITICAL",
              issuedAt: "10 mins ago",
              description: "Heavy rainfall (65 mm/hr) detected. Avoid low-lying underpasses and Drain D07 corridor.",
              actionNeeded: "Use elevated bypass routes toward St. Jude Shelter."
            },
            {
              id: "ALT-002",
              title: "Extreme Heat Anomaly Notice",
              severity: "HIGH",
              issuedAt: "35 mins ago",
              description: "Midtown temperature index reaching 41.2°C.",
              actionNeeded: "Hydration stations open at Community Center B."
            }
          ]
        }
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/citizen/home") {
      json(res, 200, {
        success: true,
        data: {
          localSafetyScore: "SAFE (92%)",
          activeAdvisories: 2,
          nearestShelter: "St. Jude Community Center (1.2 km)",
          shelterCapacity: "84% Available"
        }
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/citizen/routes/search") {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      json(res, 200, {
        success: true,
        data: {
          routeId: "RTE-SAFE-01",
          originName: body.origin || "Sector 04-A",
          destinationName: body.destination || "St. Jude Hospital Shelter",
          totalDistanceKm: 3.2,
          estimatedTimeMins: 12,
          safetyRating: "SAFE (98% Clear)",
          hazardIntersections: 0,
          waypoints: ["Avenue 4", "Highridge Bypass", "Shelter Entrance Gate C"]
        }
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/citizen/sos") {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      json(res, 201, {
        success: true,
        data: {
          sosTicketId: `SOS-${Date.now()}`,
          status: "DISPATCHED",
          message: "Emergency assistance request received. Nearest tactical unit dispatched.",
          details: body
        }
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/citizen/report") {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      json(res, 201, {
        success: true,
        data: {
          reportId: `RPT-${Date.now()}`,
          status: "RECEIVED",
          message: "Citizen hazard report logged successfully.",
          details: body
        }
      });
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
});

server.listen(PORT, () => {
  console.log(`ClimateShield engine listening on http://localhost:${PORT}`);
});
