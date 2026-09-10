# ClimateShield — Mocks & Asset Audit Specification

This document inventories all hardcoded mock data values, simulated sensor feeds, and external CDN assets across the 8 consolidated Google Stitch screens in **ClimateShield**.

---

## 1. Screen-by-Screen Mock Inventory

| Screen | Route | Mocked Element | Hardcoded Value in UI | Component / Tag |
| :--- | :--- | :--- | :--- | :--- |
| **Login / Role Preview** | `/login` | System Version | `Resilience System 4.2` | `<Mock label="Release Version">` |
| | | Build Tag | `Version 4.2.1-b` | `<Mock label="Build Tag">` |
| | | Active Grid | `Metro Coastal Sector 04-A` | `<Mock label="Sector Name">` |
| | | Telemetry Sync Rate | `99.98% Synced` | `<Mock label="Sync Rate">` |
| **Citizen Live Map** | `/citizen/map` | Current Ward | `Downtown & Waterfront` | `<Mock label="Current Ward">` |
| | | Sensor Health | `Sensors: 100%` | `<Mock label="Telemetry Sync">` |
| | | Tidal Surge Marker | `Creek Tidal Surge +0.4m` | `<Mock label="Hazard Label">` |
| | | Thermal Marker | `Heat Stress 38°C` | `<Mock label="Hazard Label">` |
| | | Air Quality Toggle | `Air AQI 64` | `<Mock label="Air AQI Value">` |
| | | Risk Summary Toast | `3 risks nearby • Rain arriving in 25m` | `<Mock label="Nearby Risk Summary">` |
| | | Metropolitan Safety Index | `Moderate Caution` | `<Mock label="Safety Level">` |
| | | Corridor Status | `Safe Corridor Active` | `<Mock label="Corridor Status">` |
| **Citizen Alerts Feed** | `/citizen/alerts` | Active Alerts Count | `3` (All Alerts pill) | Dynamic / Filtered |
| | | Flash Flood Alert | `Rapid Inundation on South Waterfront` | `<Mock label="Alert Headline">` |
| | | Flood Timestamp | `Updated 4m ago` | `<Mock label="Update Delta">` |
| | | Heat Anomaly Alert | `Extreme Urban Heat Island Anomaly` | `<Mock label="Alert Headline">` |
| | | Heat Timestamp | `Updated 18m ago` | `<Mock label="Update Delta">` |
| | | Corridor Cleared | `Highline Arterial Corridor Cleared` | `<Mock label="Alert Headline">` |
| | | Cleared Timestamp | `Updated 32m ago` | `<Mock label="Update Delta">` |
| **Flood Sector Detail** | `/rescue/incident/:id` | Sector Designation | `SECTOR 04-B` | `<Mock label="Sector ID">` |
| | | Radar Sync Pulse | `RADAR SYNC: 14s AGO` | `<Mock label="Sync Rate">` |
| | | Composite Risk Score | `82 / 100` | `<Mock label="Risk Metric">` |
| | | Corridor Name | `Bayou Crossing Corridor` | `<Mock label="Corridor Name">` |
| | | Elapsed Delta | `UPDATED 1m AGO` | `<Mock label="Elapsed Time">` |
| | | Road Inundation | `2.4 km` (Impacting Loop 610) | `<Mock label="Road Distance">` |
| | | Maximum Water Depth | `120 mm` (+15mm / 10min) | `<Mock label="Water Depth">` |
| | | Evacuation Shelter | `St. Jude Emergency Evacuation Gate` | `<Mock label="Shelter Landmark">` |
| **Safe Route Select** | `/rescue/route/:incidentId` | Safe Gradient | `+18.2m MSL` | `<Mock label="Corridor MSL">` |
| | | Route A Title | `Route A via Highline Ridge` | `<Mock label="Route A Title">` |
| | | Route A Metrics | `18 min`, `8.4 km`, `+14m Peak Elevation` | `<Mock label="ETA">` |
| | | Route B Title | `Route B via Central Ave` | `<Mock label="Route B Title">` |
| | | Route B Metrics | `14 min`, `6.1 km`, `Faster (-4m)` | `<Mock label="ETA">` |
| | | Route C Title | `Route C via River Parkway` | `<Mock label="Route C Title">` |
| | | Route C Metrics | `26 min`, `9.2 km`, `+8 min Delay` | `<Mock label="ETA">` |
| **Active Navigation** | `/rescue/navigate/:routeId` | Unit Callout | `Alpha-02` | `<Mock label="Unit Callout">` |
| | | Next Turn Directive | `In 320m Turn Left onto Highline Elevation Ramp` | `<Mock label="Next Instruction">` |
| | | Elevation Clearance | `+16m MSL` | `<Mock label="Corridor Safe">` |
| | | ETA Time | `04:18` (On Schedule) | `<Mock label="ETA Time">` |
| | | Remaining Distance | `1.1 km` (Bypass Clear) | `<Mock label="Distance Left">` |
| | | Victim Readout | `4 Trapped` at 412 Bayshore | `<Mock label="Victim Count">` |
| | | Sensor Telemetry | `Sensor S-08 (Marsh Drain) · 0.8m Dep.` | `<Mock label="Telemetry Sensor">` |
| | | Breach Alert | `Breach +1.2m` | `<Mock label="Breach Level">` |
| **Emergency SOS** | `/rescue/sos` | Precision Fix | `Downtown Waterfront ±4m` | `<Mock label="Location">` |
| | | Coordinates | `37.7749° N, 122.4194° W` | `<Mock label="Coordinates">` |
| | | Sector Micro-Telemetry | `+1.4m surge in Harbor District 04` | `<Mock label="Sector Scan">` |
| **Hazard Report** | `/rescue/report` | GPS Anchor | `Bayshore Blvd & 4th St` | `<Mock label="Location">` |
| | | Photo Timestamp | `14:28:02` (IMG_9402.JPG) | `<Mock label="Timestamp">` |
| | | Hydro-Gauge | `Hydro-Gauge #44B` | `<Mock label="Sensor Name">` |
| | | Gauge Metrics | `Crest: +2.4 ft`, `Rate: +0.8 in/m` | `<Mock label="Sensor Crest">` |

---

## 2. Asset Audit (External Stitch / Google CDN URLs)

All images from the original Stitch export are hosted on Google User Content (`lh3.googleusercontent.com`). Below is the complete catalog of these assets and their purpose:

| Asset Description | Origin Screen | Google CDN URL | Local Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **User Profile Avatar** | Global Header (`Header.tsx`, `LoginPage.tsx`) | `https://lh3.googleusercontent.com/aida/AEtjO1WZa1gNvntWWeiT4QhM-l_fIhJeTNPgwhOocSm5zkFiyeUn3CdWKg2P6QBAp2739f4ineyLsZACoh0wcEewdNPLn7dJp1NR4H3lnvVimUYZHBtoiKTEcHeUelauAMp_CGDEiOGu2-Yqz4_Vqk5IejETJ6u1R9tsOCq5DwbAv411fFrUovtU623EzW2rGPgJX0iZQ2U-lv-rR-wRns1wPkTfcV5BBGcpGIRxWJQowEeXYjkRRS5BZt3IWUg` | Standard rounded placeholder with `person` material symbol |
| **Flood Sector Map Canvas** | `FloodDetailPage.tsx` | `https://lh3.googleusercontent.com/aida-public/AB6AXuAoKsL583yl1zE6HpAIdBCVXmngZJsm1nKwbHsRApc6ek8oWBHKlTDsZgmueXNbb4wUB6kdCOcWuxfl3P7AHlCnMoKthn91MpR9MBGX9t5qePmLtV4zAOjNv4Mbgeb6HbXRuVvYWAyREbINvTLR0Vqs-vMvuMYeD5dsGYZCPTCFKFWNubUbFfh22ouA6tXqk32aXGl7Tx2xFIYbgzOK7WW5wVwFsg7M-Qp8CuXteCHl1syYuN3oLYXL` | Neutral GIS slate container (`bg-surface-container-low`) |
| **Route Map Canvas** | `RouteSelectPage.tsx` | `https://lh3.googleusercontent.com/aida-public/AB6AXuBozV8_84xgwSOE9bpJeRkP6Kr1FrQxgmc_MzlokfkJ1fWorkEKrRApHzEnszZVr5bNUB7eWuOW23UCxnvjoW6XtD9LF6mSaFboqi7LruF4g5vb9Jxa4IK8fnVchAVEL8KKGjFvGqWmkQxze8Ta-8B_pD3nILBR2p2kRGOlI4YToNdE_387yRAQ3ionVhliT_qEuouwFUhyZ4DMPc634mHamVpWUUoD3ZeNkHuR8LPNZhBwaiP_Zzpv` | Vector grid canvas with gradient |
| **Active Nav Marsh Corridor** | `ActiveNavPage.tsx` | `https://lh3.googleusercontent.com/aida-public/AB6AXuAzCVuM_w_tNQyQUy1juDIi6wI6lV2O31K1mKRbKujNmvW7sXxdyM72ohBjn03L368TFzVwkRlRxKzrGtoYAN-pa-qjjNxP8yL3EJ5f63_FjmMc_5an8_bGQg_rs3T1E2s6WHrBressPjJqnawKiQY_3a_u0pMHQdfqfnBz4PV6EJ0DRP2ezQxrIh515bMi4PSjMRK493RaYJWCgqhDo_suVrdfenAEHNwjUWRpumrXVNzFEyIOi4fi` | High-contrast vector overlay canvas (`bg-surface-dim`) |
| **Satellite Thermal Aerial** | `SosEmergencyPage.tsx` | `https://lh3.googleusercontent.com/aida-public/AB6AXuDOl0bY7-w_K8vfOxIsIAUoxvWEkIxbs4U9yRrrmaoNXgEo7dUarVeHUcfh1qSpWxH_JzbGdPb09g8oH79x1tdllsSYWpURRfNQG1LLXFf59visaGaDTFna_aX4-BumOYG6FiS8eapXNf1sk0cLXLr8d5s_FfM4BAZ5Ul06HP0cVu9tBsTkNZawuP35H33oej8damzbInTzaIaxx7RnPfc5IFI-yaYqzJpdWLBmlh7eT7jeA8jJOxlY` | Sensor status block with telemetry icon |
| **Waterlogging Field Photo** | `HazardReportPage.tsx` | `https://lh3.googleusercontent.com/aida-public/AB6AXuBnGTttCC3z4E2rK7cVF3S2HzTqliUTLVfEdlmLWSOVh4fcblt9stWJH_etFG7eZ49tjdI-o696NTnpi3ntLtZBhq_XinyyQqZ80FiVOgNKKzFrSHhNb6H1fm3656-fbYbH7SyV98bwtZ467oK0ANJ4csVryFYAsoLMUIQlg_Ev6L-cZ1xQiBkJJTq_qvkWXce1YVlu-DV2Yt77pK_MauJnLb3NnqmHkS_vKE_8t6h9s52vc6lqpo9U` | File upload slot preview |

---

## 3. Lossless Token Consolidation Verification

All 47 colors, 14 typography entries, 6 border-radii, and 12 spacing tokens defined in `DESIGN.md` have been consolidated into `client/tailwind.config.js`:
- **Typography Scale**: Both `fontSize` (with line heights, tracking, and weights) and `fontFamily` are mapped identically so that `font-*` and `text-*` classes resolve directly without relying on the CDN Tailwind runtime.
- **Elevation Tokens**: Surface elevations `surface-container-lowest` through `surface-container-highest` provide high-contrast depth.
- **Dual-Track Colors**: Operational severity tokens (`severity-safe`, `severity-moderate`, `severity-critical`) and physical hazard phenotype tokens (`hazard-flood`, `hazard-heat`, `hazard-storm`) are segregated cleanly.

---

## 4. Routing Architecture

| Screen Name | Path | Access Mode | Layout Components Used |
| :--- | :--- | :--- | :--- |
| **Login / Role Preview** | `/login` | Public | `Header`, `BottomNav`, `SosFab` |
| **Citizen Live Map** | `/citizen/map` | Citizen | `Header`, `BottomNav`, `SosFab` |
| **Citizen Alerts Feed** | `/citizen/alerts` | Citizen | `Header`, `BottomNav`, `SosFab` |
| **Flood Sector Detail** | `/rescue/incident/:id` | Rescue | `Header` (with back action) |
| **Route Select** | `/rescue/route/:incidentId` | Rescue | `Header` (with back action), `StickyActionBar` |
| **Active Nav** | `/rescue/navigate/:routeId` | Rescue | `Header` (with back action), `NAV FAB` |
| **Emergency SOS** | `/rescue/sos`, `/citizen/sos` | Universal | `Header` (with back action) |
| **Hazard Report** | `/rescue/report`, `/citizen/report` | Universal | `Header` (with back action), `StickyActionBar` |
| **Operations Console** | `/console/*`, `/gov/*` | Government | `TopNav`, `Sidebar`, full GIS Desktop Shell |
