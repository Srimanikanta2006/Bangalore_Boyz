import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { explainWithGeminiOrFallback } from "./ai/geminiProvider.ts";
import { computeHotspots, validateHistoricalIncidents } from "./ai/hotspotIntelligence.ts";
import { SAMPLE_HISTORICAL_INCIDENTS } from "./ai/hotspotSampleData.ts";
import type { HazardType } from "./ai/schemas.ts";
import { toExplainRequest } from "./engine/explainAdapter.ts";
import { simulateHazard } from "./engine/hazardSimulator.ts";
import { PILOT_GRAPH } from "./engine/pilotGraph.ts";
import { findSafeRoute } from "./engine/routeEngine.ts";
import { getCascade, getSnapshot, saveRoute, saveSnapshot } from "./engine/store.ts";

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
      const hazardFilter = url.searchParams.get("hazardType") as HazardType | null;
      const minScoreParam = url.searchParams.get("minScore");
      const assetFilter = url.searchParams.get("assetId");

      const minScore = minScoreParam ? Number(minScoreParam) : undefined;
      let hotspots = computeHotspots(SAMPLE_HISTORICAL_INCIDENTS, { minRecurrenceScore: minScore });

      if (hazardFilter) {
        hotspots = hotspots.filter((h) => h.hazardType === hazardFilter);
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
    if (req.method === "POST" && url.pathname === "/api/hotspots/analyze") {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const incidentsInput = Array.isArray(body.incidents) ? body.incidents : [];
      const validated = validateHistoricalIncidents(incidentsInput);
      const minScore = typeof body.minRecurrenceScore === "number" ? body.minRecurrenceScore : undefined;
      const hotspots = computeHotspots(validated, { minRecurrenceScore: minScore });

      json(res, 200, {
        analyzedIncidents: validated.length,
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

    json(res, 404, { error: "Not found" });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
});

server.listen(PORT, () => {
  console.log(`ClimateShield engine listening on http://localhost:${PORT}`);
});
