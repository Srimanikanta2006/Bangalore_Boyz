import os
import json
import re

BASE_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz"
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DATA_DIR = os.path.join(FRONTEND_DIR, "data")
SHARED_DIR = os.path.join(FRONTEND_DIR, "shared")

os.makedirs(DATA_DIR, exist_ok=True)

# 1. Create data/explain-response.json (Contract 2)
explain_payload = {
  "incidentId": "INC-001",
  "situationSummary": "Heavy rainfall has exceeded local drainage threshold at Drain D07, causing high waterlogging risk that threatens Road R24 and ambulance access to Hospital A.",
  "causalChains": [
    {
      "path": ["D07", "R24", "Hospital-A"],
      "explanation": "Drain D07 capacity surge overflows onto Road R24 arterial corridor, cutting off primary ambulance access to Hospital A within 25 minutes.",
      "evidence": [
        "Rainfall threshold exceeded (42mm/h)",
        "Drain D07 capacity risk is high (94% saturation)",
        "Road R24 is downstream of D07",
        "Hospital A depends on R24 for emergency vehicle access"
      ],
      "impact": "Impaired emergency medical response for 3,400+ residents"
    }
  ],
  "keyImpacts": [
    { "assetId": "D07", "impact": "Inundation Overflow", "severity": "high" },
    { "assetId": "R24", "impact": "Submerged Arterial Segment", "severity": "high" },
    { "assetId": "Hospital-A", "impact": "Ambulance Access Compromised", "severity": "critical" }
  ],
  "recommendedActions": [
    {
      "actionId": "dispatch_drainage_team",
      "targetAssetId": "D07",
      "priority": "critical",
      "reason": "Reduce the risk of waterlogging at Drain D07 before it affects Road R24."
    }
  ],
  "uncertainties": [
    "Secondary convective storm cell trajectory ±15 mins"
  ],
  "dataFreshness": { "overall": "fresh" },
  "roleSpecificBriefings": {
    "operator": "EOC Director Action Required: Approve dispatch of Tactical Unit Bravo-4 to Drain D07.",
    "fieldTeam": "Tactical Unit Bravo-4: Deploy mobile pumps to Drain D07.",
    "facilityManager": "Hospital A Ops: Prepare emergency access bypass via Gate 3."
  },
  "confidence": 0.88,
  "explanation": "Rainfall intensity at 42mm/h exceeds Drain D07 design parameters, causing rapid cascade along Road R24 to Hospital A.",
  "impactSummary": "3 critical infrastructure assets affected; 25-minute ETA to critical breach point."
}

with open(os.path.join(DATA_DIR, "explain-response.json"), 'w', encoding='utf-8') as f:
    json.dump(explain_payload, f, indent=2)

print("Saved frontend/data/explain-response.json")

# 2. Create data/tasks-mock-response.json (Contract 3 Response)
task_response = {
  "taskId": "TSK-4091",
  "incidentId": "INC-001",
  "actionId": "dispatch_drainage_team",
  "targetAssetId": "D07",
  "priority": "critical",
  "status": "created",
  "assignedTeam": "Tactical Unit Bravo-4",
  "timestamp": "2026-09-10T16:50:00Z",
  "message": "Task successfully created and routed to P1 Task Dispatch engine."
}

with open(os.path.join(DATA_DIR, "tasks-mock-response.json"), 'w', encoding='utf-8') as f:
    json.dump(task_response, f, indent=2)

print("Saved frontend/data/tasks-mock-response.json")

# 3. Update data/hotspots.json (Contract 4)
hotspots_payload = [
  {
    "hotspotId": "HS-D07-heavy_rainfall",
    "assetId": "D07",
    "hazardType": "heavy_rainfall",
    "incidentCount": 7,
    "recurrenceScore": 86,
    "severityScore": 82,
    "lastIncidentAt": "2026-08-14T12:15:00Z",
    "trend": "increasing",
    "confidence": 0.91,
    "explanation": "Drain D07 has experienced repeated heavy-rainfall incidents causing recurring downstream inundation along arterial Road R24.",
    "recommendedLongTermAction": "drainage_capacity_upgrade"
  },
  {
    "hotspotId": "HS-R24-urban_flood",
    "assetId": "R24",
    "hazardType": "urban_flood",
    "incidentCount": 5,
    "recurrenceScore": 74,
    "severityScore": 79,
    "lastIncidentAt": "2026-07-20T08:30:00Z",
    "trend": "stable",
    "confidence": 0.88,
    "explanation": "Low-lying underpass segment at Road R24 floods rapidly during intense precipitation events.",
    "recommendedLongTermAction": "elevated_causeway_retrofitted"
  }
]

with open(os.path.join(DATA_DIR, "hotspots.json"), 'w', encoding='utf-8') as f:
    json.dump(hotspots_payload, f, indent=2)

print("Saved frontend/data/hotspots.json")

# 4. Update shared/config.js
config_js_content = """/**
 * ClimateShield Application Configuration
 *
 * P1/P2/P4 Integration Contract Endpoint Specification.
 * Switch DATA_MODE to "live" when real P1/P2/P4 APIs are online.
 * Zero UI code changes required — only backend URL mappings change!
 */
window.CONFIG = {
  DATA_MODE: "mock", // "mock" | "live"
  API_BASE_URL: "https://api.climateshield.org/v1",
  EXPLAIN_API_URL: "/api/explain",
  TASK_API_URL: "/api/tasks",
  HOTSPOTS_API_URL: "/api/hotspots",
  GRAPH_API_URL: "/api/graph",
  POLL_INTERVAL_MS: 15000
};
"""

with open(os.path.join(SHARED_DIR, "config.js"), 'w', encoding='utf-8') as f:
    f.write(config_js_content)

print("Updated frontend/shared/config.js")

# 5. Update shared/app.js to support Contract 2 rendering & Contract 3 Operator Approval Flow
app_js_content = """/**
 * ClimateShield Application Core Engine
 * Handles navigation partial injection, sliding sidebar drawer toggle,
 * Contract 2 P4 AI explanation binding, Contract 3 Operator Approval,
 * relative path resolution, and data binding.
 */

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    initShell();
    initDataBinding();
    initExplainContractBinding();
    initInteractivity();
    initSidebarToggle();
  });

  function getBasePath() {
    const path = window.location.pathname.replace(/\\\\/g, '/');
    if (path.includes('/citizen/') || path.includes('/government/') || path.includes('/rescue/')) {
      return '../';
    }
    return './';
  }

  function initShell() {
    const navPlaceholder = document.getElementById("app-nav");
    if (!navPlaceholder) return;

    const base = getBasePath();
    fetch(base + "shared/nav.html")
      .then((res) => {
        if (!res.ok) throw new Error("Nav partial not found");
        return res.text();
      })
      .then((html) => {
        navPlaceholder.innerHTML = html;
        activateCurrentRoleNav();
      })
      .catch((err) => console.warn("Nav partial failed to load:", err));
  }

  function activateCurrentRoleNav() {
    const path = window.location.pathname.replace(/\\\\/g, '/');

    // Hide all role navs by default
    document.querySelectorAll(".role-nav").forEach(el => el.classList.add("hidden"));

    let role = "citizen";
    if (path.includes("/government/")) {
      role = "government";
    } else if (path.includes("/rescue/")) {
      role = "rescue";
    } else if (path.includes("login.html")) {
      return; // Login page has no shell nav
    }

    const navElem = document.getElementById(`nav-${role}`);
    if (navElem) {
      navElem.classList.remove("hidden");
    }

    // Highlight matching link
    const filename = path.split('/').pop();
    const links = document.querySelectorAll(`#nav-${role} a.nav-item`);
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && (href === filename || href.endsWith('/' + filename))) {
        link.classList.add("active");
      }
    });
  }

  function initSidebarToggle() {
    document.body.addEventListener("click", function (e) {
      const toggleBtn = e.target.closest("[data-action='toggle-sidebar']");
      if (toggleBtn) {
        e.preventDefault();
        const sidebar = document.querySelector("aside.gov-sidebar") || document.querySelector("aside");
        const container = document.querySelector(".gov-main-container") || document.querySelector(".pl-64");

        if (sidebar) sidebar.classList.toggle("collapsed");
        if (container) container.classList.toggle("sidebar-collapsed");
      }
    });
  }

  function initDataBinding() {
    const bindElems = document.querySelectorAll("[data-bind]");
    if (bindElems.length === 0) return;

    const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
    const dataSources = ["kpis", "hazards", "incidents", "missions", "routes", "hotspots"];
    const base = getBasePath();

    dataSources.forEach((source) => {
      const url = mode === "mock" 
        ? `${base}data/${source}.json` 
        : `${window.CONFIG.API_BASE_URL}/${source}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          bindElems.forEach((elem) => {
            const key = elem.getAttribute("data-bind");
            const [src, field] = key.split(".");
            if (src === source && data) {
              const val = data[field];
              if (val !== undefined) {
                elem.textContent = typeof val === 'object' ? JSON.stringify(val) : val;
              }
            }
          });
        })
        .catch((err) => console.log(`Data fetch info (${source}):`, err.message));
    });
  }

  function initExplainContractBinding() {
    const explainContainer = document.getElementById("p4-explain-container");
    if (!explainContainer) return;

    const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
    const base = getBasePath();
    const url = mode === "mock"
      ? `${base}data/explain-response.json`
      : window.CONFIG.EXPLAIN_API_URL;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // Render 8 MVP Priority Order fields:
        // 1. situationSummary
        const summaryElem = document.getElementById("p4-situation-summary");
        if (summaryElem) summaryElem.textContent = data.situationSummary;

        // 2. causalChains (Diagram Nodes)
        const chainElem = document.getElementById("p4-causal-chain-path");
        if (chainElem && data.causalChains && data.causalChains[0]) {
          chainElem.textContent = data.causalChains[0].path.join(" → ");
        }
        const chainExpElem = document.getElementById("p4-causal-chain-explanation");
        if (chainExpElem && data.causalChains && data.causalChains[0]) {
          chainExpElem.textContent = data.causalChains[0].explanation;
        }

        // 3. keyImpacts
        const impactsElem = document.getElementById("p4-key-impacts");
        if (impactsElem && data.keyImpacts) {
          impactsElem.innerHTML = data.keyImpacts.map(imp => 
            `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">${imp.assetId}: ${imp.impact} (${imp.severity.toUpperCase()})</span>`
          ).join(" ");
        }

        // 4 & 5. recommendedActions & Priority
        if (data.recommendedActions && data.recommendedActions[0]) {
          const act = data.recommendedActions[0];
          const actElem = document.getElementById("p4-action-reason");
          if (actElem) actElem.textContent = act.reason;

          const actTargetElem = document.getElementById("p4-action-target");
          if (actTargetElem) actTargetElem.textContent = `${act.actionId} → Target ${act.targetAssetId}`;

          const prioElem = document.getElementById("p4-action-priority");
          if (prioElem) prioElem.textContent = act.priority.toUpperCase();
        }

        // 6. confidence
        const confElem = document.getElementById("p4-confidence");
        if (confElem) confElem.textContent = `${Math.round(data.confidence * 100)}% Confidence`;

        // 7. uncertainties
        const uncElem = document.getElementById("p4-uncertainties");
        if (uncElem && data.uncertainties) {
          uncElem.textContent = data.uncertainties.join("; ");
        }
      })
      .catch((err) => console.log("Explain contract load info:", err.message));
  }

  function initInteractivity() {
    document.body.addEventListener("click", function (e) {
      // CONTRACT 3 — Operator Approval Button Handler
      const approveBtn = e.target.closest("[data-action='approve-recommendation']") || e.target.closest("[data-action='dispatch-team']");
      if (approveBtn) {
        e.preventDefault();

        // 1. Build Contract 3 Payload from current screen state
        const taskPayload = {
          incidentId: approveBtn.getAttribute("data-incident-id") || "INC-001",
          actionId: approveBtn.getAttribute("data-action-id") || "dispatch_drainage_team",
          targetAssetId: approveBtn.getAttribute("data-target-asset") || "D07",
          priority: approveBtn.getAttribute("data-priority") || "critical",
          reason: approveBtn.getAttribute("data-reason") || "Reduce the risk of waterlogging at Drain D07 before it affects Road R24."
        };

        // Visual feedback
        approveBtn.textContent = "Task Dispatched ✓";
        approveBtn.classList.remove("bg-primary", "bg-secondary");
        approveBtn.classList.add("bg-emerald-600", "text-white");

        // 2. POST to P1 Task Endpoint (configured in config.js)
        const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
        const base = getBasePath();
        const taskUrl = mode === "mock"
          ? `${base}data/tasks-mock-response.json`
          : window.CONFIG.TASK_API_URL;

        const fetchOptions = mode === "mock" 
          ? { method: "GET" } 
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(taskPayload)
            };

        fetch(taskUrl, fetchOptions)
          .then((res) => res.json())
          .then((resData) => {
            console.log("Contract 3 Task Dispatch Response:", resData);
            setTimeout(() => {
              window.location.href = base + "rescue/mission_detail.html";
            }, 700);
          })
          .catch((err) => {
            console.warn("Task POST fallback redirect:", err);
            setTimeout(() => {
              window.location.href = base + "rescue/mission_detail.html";
            }, 700);
          });
      }

      // Toggle Flood Sheet Panel (In-Page)
      const floodTrigger = e.target.closest("[data-action='toggle-flood-sheet']");
      if (floodTrigger) {
        e.preventDefault();
        const sheet = document.getElementById("flood-sheet-modal");
        if (sheet) sheet.classList.toggle("hidden");
      }

      // Toggle Zone Detail Side Panel (In-Page)
      const zoneTrigger = e.target.closest("[data-action='toggle-zone-detail']");
      if (zoneTrigger) {
        e.preventDefault();
        const panel = document.getElementById("zone-detail-panel");
        if (panel) panel.classList.toggle("hidden");
      }
    });
  }
})();
"""

with open(os.path.join(SHARED_DIR, "app.js"), 'w', encoding='utf-8') as f:
    f.write(app_js_content)

print("Updated frontend/shared/app.js with Contract 2 & Contract 3 approval flow")

