/**
 * ClimateShield Centralized API Configuration
 *
 * Centralized API base URL and token storage settings.
 * To change backend IP or port, update API_BASE_URL below!
 */
window.CONFIG = {
  DATA_MODE: "live", // "live" | "mock"
  API_BASE_URL: "http://172.19.39.31:4000/api",
  RESCUE_API_BASE_URL: "http://localhost:4001/api",
  DEMO_CREDENTIALS: {
    email: "government@climateshield.demo",
    password: "DemoGov@2024"
  },
  TOKEN_STORAGE_KEY: "climateshield_gov_token",
  EXPLAIN_API_URL: "/api/explain",
  TASK_API_URL: "/api/tasks",
  HOTSPOTS_API_URL: "/api/hotspots",
  GRAPH_API_URL: "/api/graph",
  POLL_INTERVAL_MS: 15000
};
