/**
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
