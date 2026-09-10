/**
 * ClimateShield Base Authenticated API Client
 * Manages JWT tokens, Authorization headers, and response normalization.
 */

(function (window) {
  const config = window.CONFIG || {
    API_BASE_URL: "http://172.19.39.31:4000/api",
    TOKEN_STORAGE_KEY: "climateshield_gov_token"
  };

  function getToken() {
    return sessionStorage.getItem(config.TOKEN_STORAGE_KEY) || localStorage.getItem(config.TOKEN_STORAGE_KEY) || null;
  }

  function setToken(token) {
    if (token) {
      sessionStorage.setItem(config.TOKEN_STORAGE_KEY, token);
      localStorage.setItem(config.TOKEN_STORAGE_KEY, token);
    }
  }

  function removeToken() {
    sessionStorage.removeItem(config.TOKEN_STORAGE_KEY);
    localStorage.removeItem(config.TOKEN_STORAGE_KEY);
  }

  /**
   * Authenticated Fetch Wrapper
   */
  async function authenticatedFetch(endpoint, options = {}) {
    const baseUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : config.API_BASE_URL;
    const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };

    if (token && !endpoint.includes("/auth/login") && !endpoint.includes("/health")) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchOptions = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, fetchOptions);
      
      if (response.status === 401) {
        console.warn("Authentication session expired. Re-authenticating...");
        removeToken();
      }

      const rawText = await response.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (e) {
        data = { rawText };
      }

      if (!response.ok) {
        const errorMsg = (data && data.error && data.error.message) || data.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      // Normalize `{ success: true, data: ... }` response shape
      if (data && data.success !== undefined) {
        if (!data.success) {
          throw new Error((data.error && data.error.message) || "API returned success = false");
        }
        return data.data !== undefined ? data.data : data;
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  window.ApiClient = {
    getToken,
    setToken,
    removeToken,
    authenticatedFetch
  };
})(window);
