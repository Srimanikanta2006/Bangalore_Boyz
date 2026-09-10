/**
 * ClimateShield Application Core Engine
 * Integrates Live Government Backend API (http://172.19.39.31:4000/api),
 * Token Management, Contract 2 & 4 Adapters, and Contract 3 Human Operator Task Approval.
 */

(function () {
  document.addEventListener("DOMContentLoaded", async function () {
    initShell();
    await autoAuthenticateRole();
    initLiveGovernmentData();
    initExplainContractBinding();
    initInteractivity();
    initSidebarToggle();

    // Periodic Auto-Refresh for Live Telemetry & Climate Hazards (Every 15s)
    const pollInterval = (window.CONFIG && window.CONFIG.POLL_INTERVAL_MS) || 15000;
    setInterval(() => {
      if (window.CONFIG && window.CONFIG.DATA_MODE === "live") {
        initLiveGovernmentData();
        initExplainContractBinding();
      }
    }, pollInterval);
  });

  function getBasePath() {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.includes('/citizen/') || path.includes('/government/') || path.includes('/rescue/')) {
      return '../';
    }
    return './';
  }

  async function autoAuthenticateRole() {
    const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
    if (mode !== "live") return;
    if (window.ApiClient.getToken()) return;

    const path = window.location.pathname.replace(/\\/g, '/');

    try {
      if (path.includes("/government/") && window.GovernmentApi) {
        console.log("Authenticating Government Officer Profile...");
        await window.GovernmentApi.login();
      } else if (path.includes("/rescue/") && window.RescueApi) {
        console.log("Authenticating Rescue Tactical Profile...");
        await window.RescueApi.login();
      } else if (path.includes("/citizen/") && window.CitizenApi) {
        console.log("Authenticating Citizen Profile...");
        await window.CitizenApi.login();
      } else if (window.GovernmentApi) {
        await window.GovernmentApi.login();
      }
      console.log("Authentication successful! Bearer token acquired.");
    } catch (err) {
      console.warn("Live Backend authentication failed (falling back gracefully):", err.message);
    }
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
    const path = window.location.pathname.replace(/\\/g, '/');

    // Hide all role navs by default
    document.querySelectorAll(".role-nav").forEach(el => el.classList.add("hidden"));

    let role = "citizen";
    if (path.includes("/government/")) {
      role = "government";
    } else if (path.includes("/rescue/")) {
      role = "rescue";
    } else if (path.includes("login.html")) {
      return;
    }

    const navElem = document.getElementById(`nav-${role}`);
    if (navElem) {
      navElem.classList.remove("hidden");
    }

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

  async function initLiveGovernmentData() {
    const bindElems = document.querySelectorAll("[data-bind]");
    if (bindElems.length === 0) return;

    const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
    const base = getBasePath();

    if (mode === "live" && window.GovernmentApi) {
      try {
        // Fetch Live Government Overview
        const liveOverview = await window.GovernmentApi.getGovernmentOverview();
        const adaptedKpis = window.Adapters ? window.Adapters.adaptOverviewToFrontend(liveOverview) : liveOverview;

        bindElems.forEach((elem) => {
          const key = elem.getAttribute("data-bind");
          const [src, field] = key.split(".");
          if (src === "kpis" && adaptedKpis && adaptedKpis[field] !== undefined) {
            elem.textContent = adaptedKpis[field];
          }
        });
        return;
      } catch (err) {
        console.warn("Unable to fetch live Government Overview, falling back to local dataset:", err.message);
      }
    }

    // Fallback or Mock mode data binding
    const dataSources = ["kpis", "hazards", "incidents", "missions", "routes", "hotspots"];
    dataSources.forEach((source) => {
      fetch(`${base}data/${source}.json`)
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

  async function initExplainContractBinding() {
    const explainContainer = document.getElementById("p4-explain-container");
    if (!explainContainer) return;

    const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
    const base = getBasePath();
    let contract2Data = null;

    if (mode === "live" && window.GovernmentApi) {
      try {
        // Try fetching live zone & cascade from real backend
        const zoneData = await window.GovernmentApi.getZone("04-B").catch(() => ({}));
        const cascadeData = await window.GovernmentApi.getZoneCascade("04-B").catch(() => ({}));
        contract2Data = window.Adapters.adaptZoneToContract2(zoneData, cascadeData);
      } catch (err) {
        console.warn("Unable to fetch live zone cascade, fallback to contract JSON:", err.message);
      }
    }

    if (!contract2Data) {
      try {
        const res = await fetch(`${base}data/explain-response.json`);
        contract2Data = await res.json();
      } catch (err) {
        console.log("Local contract JSON info:", err.message);
        return;
      }
    }

    // Render 8 MVP Priority Order fields:
    // 1. situationSummary
    const summaryElem = document.getElementById("p4-situation-summary");
    if (summaryElem) summaryElem.textContent = contract2Data.situationSummary;

    // 2. causalChains (Diagram Nodes)
    const chainElem = document.getElementById("p4-causal-chain-path");
    if (chainElem && contract2Data.causalChains && contract2Data.causalChains[0]) {
      chainElem.textContent = contract2Data.causalChains[0].path.join(" → ");
    }
    const chainExpElem = document.getElementById("p4-causal-chain-explanation");
    if (chainExpElem && contract2Data.causalChains && contract2Data.causalChains[0]) {
      chainExpElem.textContent = contract2Data.causalChains[0].explanation;
    }

    // 3. keyImpacts
    const impactsElem = document.getElementById("p4-key-impacts");
    if (impactsElem && contract2Data.keyImpacts) {
      impactsElem.innerHTML = contract2Data.keyImpacts.map(imp =>
        `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">${imp.assetId}: ${imp.impact} (${(imp.severity || 'HIGH').toUpperCase()})</span>`
      ).join(" ");
    }

    // 4 & 5. recommendedActions & Priority
    if (contract2Data.recommendedActions && contract2Data.recommendedActions[0]) {
      const act = contract2Data.recommendedActions[0];
      const actElem = document.getElementById("p4-action-reason");
      if (actElem) actElem.textContent = act.reason;

      const actTargetElem = document.getElementById("p4-action-target");
      if (actTargetElem) actTargetElem.textContent = `${act.actionId} → Target ${act.targetAssetId}`;

      const prioElem = document.getElementById("p4-action-priority");
      if (prioElem) prioElem.textContent = (act.priority || 'CRITICAL').toUpperCase();
    }

    // 6. confidence
    const confElem = document.getElementById("p4-confidence");
    if (confElem) confElem.textContent = `${Math.round((contract2Data.confidence || 0.88) * 100)}% Confidence`;

    // 7. uncertainties
    const uncElem = document.getElementById("p4-uncertainties");
    if (uncElem && contract2Data.uncertainties) {
      uncElem.textContent = Array.isArray(contract2Data.uncertainties) ? contract2Data.uncertainties.join("; ") : contract2Data.uncertainties;
    }
  }

  function initInteractivity() {
    document.body.addEventListener("click", async function (e) {
      // CONTRACT 3 — Human Operator Approval Button Handler
      const approveBtn = e.target.closest("[data-action='approve-recommendation']") || e.target.closest("[data-action='dispatch-team']");
      if (approveBtn) {
        e.preventDefault();

        const rawContract3 = {
          incidentId: approveBtn.getAttribute("data-incident-id") || "INC-001",
          actionId: approveBtn.getAttribute("data-action-id") || "dispatch_drainage_team",
          targetAssetId: approveBtn.getAttribute("data-target-asset") || "D07",
          priority: approveBtn.getAttribute("data-priority") || "critical",
          reason: approveBtn.getAttribute("data-reason") || "Reduce the risk of waterlogging at Drain D07 before it affects Road R24."
        };

        // Adapt Contract 3 shape to real Backend POST /tasks payload
        const backendTaskPayload = window.Adapters
          ? window.Adapters.adaptContract3ToTaskPayload(rawContract3)
          : rawContract3;

        // Visual feedback
        approveBtn.textContent = "Task Dispatched ✓";
        approveBtn.classList.remove("bg-primary", "bg-secondary");
        approveBtn.classList.add("bg-emerald-600", "text-white");

        const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
        const base = getBasePath();

        if (mode === "live" && window.GovernmentApi) {
          try {
            console.log("Sending real POST /tasks payload to backend:", backendTaskPayload);
            const taskRes = await window.GovernmentApi.createTask(backendTaskPayload);
            console.log("Task created successfully on Live Backend:", taskRes);
          } catch (err) {
            console.warn("POST /tasks API call failed, progressing UI:", err.message);
          }
        }

        setTimeout(() => {
          window.location.href = base + "rescue/mission_detail.html";
        }, 700);
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

      // RESCUE — Field Status Report Submission
      const statusBtn = e.target.closest("[data-action='submit-status-report']");
      if (statusBtn) {
        e.preventDefault();
        statusBtn.textContent = "Status Submitted ✓";
        statusBtn.classList.remove("bg-primary", "bg-secondary");
        statusBtn.classList.add("bg-emerald-600", "text-white");

        const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
        if (mode === "live" && window.RescueApi) {
          try {
            await window.RescueApi.submitMissionStatus("MSN-402", {
              status: "IN_PROGRESS",
              notes: "High capacity pump operational at sector checkpoint."
            });
            console.log("Rescue status report submitted to live backend.");
          } catch (err) {
            console.warn("Rescue status report submit info:", err.message);
          }
        }
      }

      // CITIZEN — Emergency SOS Submission
      const sosBtn = e.target.closest("[data-action='submit-sos']");
      if (sosBtn) {
        e.preventDefault();
        sosBtn.textContent = "SOS Transmitted ✓";
        sosBtn.classList.remove("bg-red-600");
        sosBtn.classList.add("bg-emerald-600", "text-white");

        const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
        if (mode === "live" && window.CitizenApi) {
          try {
            await window.CitizenApi.sendSosRequest({
              emergencyType: "FLOOD_TRAPPED",
              peopleCount: 2,
              notes: "Urgent assistance required."
            });
            console.log("Citizen SOS transmitted to live backend.");
          } catch (err) {
            console.warn("Citizen SOS submit info:", err.message);
          }
        }
      }

      // CITIZEN — Local Hazard Report Submission
      const reportBtn = e.target.closest("[data-action='submit-report']");
      if (reportBtn) {
        e.preventDefault();
        reportBtn.textContent = "Report Submitted ✓";
        reportBtn.classList.remove("bg-primary", "bg-secondary");
        reportBtn.classList.add("bg-emerald-600", "text-white");

        const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
        if (mode === "live" && window.CitizenApi) {
          try {
            await window.CitizenApi.submitHazardReport({
              hazardCategory: "WATERLOGGING",
              description: "Water accumulating rapidly on sidewalk",
              urgency: "HIGH"
            });
            console.log("Citizen hazard report submitted to live backend.");
          } catch (err) {
            console.warn("Citizen hazard report submit info:", err.message);
          }
        }
      }
    });
  }
})();
