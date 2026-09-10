/**
 * ClimateShield Application Configuration
 *
 * Switch DATA_MODE to "live" when real API backend is available.
 * Zero changes required across UI components when toggling modes!
 */
window.CONFIG = {
  DATA_MODE: "mock", // Options: "mock" | "live"
  API_BASE_URL: "https://api.climateshield.org/v1",
  POLL_INTERVAL_MS: 15000
};
