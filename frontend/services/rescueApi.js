/**
 * ClimateShield Centralized Rescue Tactical API Service
 * Wraps all tactical mission endpoints for Rescue operations.
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

  const RescueApi = {
    // Auth & Profile
    login: async (email, password) => {
      const payload = {
        email: email || "rescue.tactical@climateshield.org",
        password: password || "DemoRescue@2024"
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

    // Missions
    getMissions: (params) => fetchApi(`/rescue/missions${buildQuery(params)}`),
    getMission: (id) => fetchApi(`/rescue/missions/${id}`),
    submitMissionStatus: (id, payload) => fetchApi(`/rescue/missions/${id}/status`, { method: "POST", body: JSON.stringify(payload) }),
    
    // Tactical Navigation & Hazards
    getTacticalNavigation: (missionId) => fetchApi(`/rescue/navigation/${missionId}`),
    getTacticalHazard: (id) => fetchApi(`/rescue/hazards/${id}`),
    
    // Tactical Command Console Feed
    getCommandConsoleFeed: () => fetchApi("/rescue/command-console")
  };

  window.RescueApi = RescueApi;
})(window);
