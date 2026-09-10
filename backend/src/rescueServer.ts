import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import {
  getCommandConsoleSummary,
  getMissionById,
  getMissions,
  getTacticalNavigation,
  getTacticalUnits,
  updateMissionStatus
} from "./rescue/rescueEngine";
import { generateTacticalDossier } from "./rescue/tacticalAi";

const PORT = Number(process.env.PORT ?? 4001);

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  try {
    // Health Check
    if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/health")) {
      json(res, 200, {
        status: "ok",
        role: "rescue-tactical-engine",
        port: PORT,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Auth Login
    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      json(res, 200, {
        success: true,
        data: {
          user: {
            id: "user_rescue_01",
            name: "Commander Vance Vance",
            email: body.email || "rescue.tactical@climateshield.org",
            role: "RESCUE_COMMANDER",
            callsign: "EM-MA1"
          },
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.climateshield_rescue_session_token"
        }
      });
      return;
    }

    // Rescue Missions List
    if (req.method === "GET" && url.pathname === "/api/rescue/missions") {
      json(res, 200, {
        success: true,
        data: {
          items: getMissions()
        }
      });
      return;
    }

    // Rescue Mission Detail & AI Dossier
    const missionDetailMatch = url.pathname.match(/^\/api\/rescue\/missions\/([^/]+)$/);
    if (req.method === "GET" && missionDetailMatch) {
      const mission = getMissionById(missionDetailMatch[1]);
      if (!mission) {
        json(res, 404, { success: false, error: { message: "Mission not found" } });
        return;
      }
      const dossier = await generateTacticalDossier(mission);
      json(res, 200, {
        success: true,
        data: {
          ...mission,
          dossier
        }
      });
      return;
    }

    // Submit Mission Status Report
    const missionStatusMatch = url.pathname.match(/^\/api\/rescue\/missions\/([^/]+)\/status$/);
    if (req.method === "POST" && missionStatusMatch) {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const updated = updateMissionStatus({
        missionId: missionStatusMatch[1],
        status: body.status || "IN_PROGRESS",
        waterDepthMm: body.waterDepthMm,
        notes: body.notes
      });
      json(res, 200, {
        success: true,
        data: {
          message: "Tactical status report submitted successfully",
          mission: updated || { id: missionStatusMatch[1], status: body.status }
        }
      });
      return;
    }

    // Tactical Navigation
    const navMatch = url.pathname.match(/^\/api\/rescue\/navigation\/([^/]+)$/);
    if (req.method === "GET" && navMatch) {
      json(res, 200, {
        success: true,
        data: getTacticalNavigation(navMatch[1])
      });
      return;
    }

    // Command Console Feed
    if (req.method === "GET" && url.pathname === "/api/rescue/command-console") {
      json(res, 200, {
        success: true,
        data: getCommandConsoleSummary()
      });
      return;
    }

    // Tactical Units Roster
    if (req.method === "GET" && url.pathname === "/api/rescue/units") {
      json(res, 200, {
        success: true,
        data: {
          items: getTacticalUnits()
        }
      });
      return;
    }

    json(res, 404, { success: false, error: { message: "Endpoint not found" } });
  } catch (error) {
    json(res, 500, { success: false, error: { message: error instanceof Error ? error.message : "Unknown error" } });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 ClimateShield Rescue Tactical Engine listening on http://localhost:${PORT}`);
});
