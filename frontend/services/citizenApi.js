/**
 * ClimateShield Centralized Citizen Mobility API Service
 * Wraps all emergency mobility, alert, SOS, and reporting endpoints for Citizens.
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

  const CitizenApi = {
    // Auth & Profile
    login: async (email, password) => {
      const payload = {
        email: email || "citizen.active@climateshield.org",
        password: password || "DemoCitizen@2024"
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

    // Alerts & Summary
    getAlerts: (params) => fetchApi(`/citizen/alerts${buildQuery(params)}`),
    getCitizenHomeSummary: () => fetchApi("/citizen/home"),

    // Routes & Navigation
    searchSafeRoutes: (payload) => fetchApi("/citizen/routes/search", { method: "POST", body: JSON.stringify(payload) }),
    getActiveNavigation: (routeId) => fetchApi(`/citizen/navigation/${routeId}`),
    
    // Hazard Sheet
    getHazardSheet: (zoneId) => fetchApi(`/citizen/hazards/${zoneId}`),

    // Submissions: Emergency SOS & Citizen Hazard Report
    sendSosRequest: (payload) => fetchApi("/citizen/sos", { method: "POST", body: JSON.stringify(payload) }),
    submitHazardReport: (payload) => fetchApi("/citizen/report", { method: "POST", body: JSON.stringify(payload) })
  };

  window.CitizenApi = CitizenApi;
})(window);
