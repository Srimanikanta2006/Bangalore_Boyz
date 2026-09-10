/**
 * ClimateShield Centralized Government API Service
 * Wraps all Postman authoritative endpoints for the live backend at port 4000.
 */

(function (window) {
  const fetchApi = (endpoint, options) => window.ApiClient.authenticatedFetch(endpoint, options);

  function buildQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, val);
      }
    });
    const str = query.toString();
    return str ? `?${str}` : "";
  }

  const GovernmentApi = {
    // Health Check
    getHealth: () => fetchApi("/health"),

    // Auth
    login: async (email, password) => {
      const payload = {
        email: email || window.CONFIG.DEMO_CREDENTIALS.email,
        password: password || window.CONFIG.DEMO_CREDENTIALS.password
      };
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const token = res.token || (res.data && res.data.token) || res;
      if (typeof token === "string") {
        window.ApiClient.setToken(token);
      }
      return res;
    },

    getCurrentUser: () => fetchApi("/auth/me"),

    // Government Overview & Response Center
    getGovernmentOverview: () => fetchApi("/government/overview"),
    getResponseCenter: () => fetchApi("/response-center"),

    // Incidents
    getIncidents: (params) => fetchApi(`/incidents${buildQuery(params)}`),
    getIncident: (id) => fetchApi(`/incidents/${id}`),
    getIncidentCascade: (id) => fetchApi(`/incidents/${id}/cascade`),
    createIncident: (payload) => fetchApi("/incidents", { method: "POST", body: JSON.stringify(payload) }),
    updateIncident: (id, payload) => fetchApi(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    updateIncidentStatus: (id, status) => fetchApi(`/incidents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    dispatchIncident: (incidentId, payload) => fetchApi(`/incidents/${incidentId}/dispatch`, { method: "POST", body: JSON.stringify(payload) }),

    // Tasks
    getTasks: (params) => fetchApi(`/tasks${buildQuery(params)}`),
    getTask: (id) => fetchApi(`/tasks/${id}`),
    getTaskHistory: (id) => fetchApi(`/tasks/${id}/history`),
    createTask: (payload) => fetchApi("/tasks", { method: "POST", body: JSON.stringify(payload) }),
    updateTaskStatus: (id, status) => fetchApi(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    assignTask: (id, payload) => fetchApi(`/tasks/${id}/assign`, { method: "POST", body: JSON.stringify(payload) }),
    verifyTask: (id, payload) => fetchApi(`/tasks/${id}/verify`, { method: "POST", body: JSON.stringify(payload) }),

    // Units
    getUnits: (params) => fetchApi(`/units${buildQuery(params)}`),
    getUnit: (id) => fetchApi(`/units/${id}`),
    updateUnitStatus: (id, status) => fetchApi(`/units/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

    // Infrastructure
    getInfrastructure: (params) => fetchApi(`/infrastructure${buildQuery(params)}`),
    getInfrastructureAsset: (id) => fetchApi(`/infrastructure/${id}`),
    getInfrastructureTelemetry: (id, params) => fetchApi(`/infrastructure/${id}/telemetry${buildQuery(params)}`),
    getInfrastructureRisk: (id) => fetchApi(`/infrastructure/${id}/risk`),
    getInfrastructureDependencies: (id) => fetchApi(`/infrastructure/${id}/dependencies`),
    getInfrastructureLogs: (id) => fetchApi(`/infrastructure/${id}/logs`),

    // Zones
    getZones: (params) => fetchApi(`/zones${buildQuery(params)}`),
    getZone: (id) => fetchApi(`/zones/${id}`),
    getZoneCascade: (zoneId) => fetchApi(`/zones/${zoneId}/cascade`),

    // Hazards
    getHazards: (params) => fetchApi(`/hazards${buildQuery(params)}`),
    getHazard: (id) => fetchApi(`/hazards/${id}`),

    // Map (GeoJSON)
    getMapAssets: (params) => fetchApi(`/map/assets${buildQuery(params)}`),
    getMapHazards: (params) => fetchApi(`/map/hazards${buildQuery(params)}`),
    getMapIncidents: (params) => fetchApi(`/map/incidents${buildQuery(params)}`),
    getMapUnits: (params) => fetchApi(`/map/units${buildQuery(params)}`),
    getMapOverlays: () => fetchApi("/map/overlays"),

    // Analytics
    getAnalyticsOverview: () => fetchApi("/analytics/overview"),

    // Hotspots
    getHotspots: (params) => fetchApi(`/hotspots${buildQuery(params)}`),
    getHotspot: (id) => fetchApi(`/hotspots/${id}`),

    // Simulator
    runSimulation: (payload) => fetchApi("/simulations", { method: "POST", body: JSON.stringify(payload) }),
    getSimulations: () => fetchApi("/simulations"),
    getSimulation: (id) => fetchApi(`/simulations/${id}`),

    // Departments
    getDepartments: (params) => fetchApi(`/departments${buildQuery(params)}`),
    getDepartment: (id) => fetchApi(`/departments/${id}`),
    getDepartmentUnits: (id, params) => fetchApi(`/departments/${id}/units${buildQuery(params)}`),
    getDepartmentReadiness: (id) => fetchApi(`/departments/${id}/readiness`),

    // Audit
    getAuditLogs: () => fetchApi("/audit")
  };

  window.GovernmentApi = GovernmentApi;
})(window);
