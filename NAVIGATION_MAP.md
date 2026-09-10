# ClimateShield Navigation Map & Site Graph

This document defines the complete site architecture, screen routes, and navigation topology for the **ClimateShield** precision climate resilience platform.

---

## 1. Role Architecture & Base Routes

| Role | Primary User Persona | Default Landing Screen | Layout Device |
|------|----------------------|-----------------------|---------------|
| **Authentication** | Demo User / Judge | [`/login.html`](./frontend/login.html) | Mobile / Responsive |
| **Citizen** | Resident / Evacuee / Traveler | [`/citizen/home.html`](./frontend/citizen/home.html) | Mobile First |
| **Government** | EOC Director / GIS Officer | [`/government/overview.html`](./frontend/government/overview.html) | Desktop Command Rail |
| **Rescue** | First Responder / Tactical Lead | [`/rescue/home.html`](./frontend/rescue/home.html) | Tactical Mobile / Tablet |

---

## 2. Complete Screen Navigation Table

| # | Screen Name | Route Path | Role | Incoming Links / Trigger | Outgoing Links / Action |
|---|-------------|------------|------|--------------------------|-------------------------|
| 1 | **Login & Role Preview** | [`/login.html`](./frontend/login.html) | Common | Entry / Logout | Citizen Home (`/citizen/home.html`), Gov Overview (`/government/overview.html`), Rescue Home (`/rescue/home.html`) |
| 2 | **Citizen Home & Live Map** | [`/citizen/home.html`](./frontend/citizen/home.html) | Citizen | Login / Nav Bar | Route Selection (`/citizen/route_selection.html`), Flood Sheet Modal, SOS FAB (`/citizen/sos.html`) |
| 3 | **Real-time Alerts Feed** | [`/citizen/alerts.html`](./frontend/citizen/alerts.html) | Citizen | Citizen Nav Bar | Hazard Detail, SOS FAB |
| 4 | **Safe Route Selection** | [`/citizen/route_selection.html`](./frontend/citizen/route_selection.html) | Citizen | Citizen Home Search / Card | Active Navigation (`/citizen/active_nav.html`) |
| 5 | **Active Navigation & Reroute** | [`/citizen/active_nav.html`](./frontend/citizen/active_nav.html) | Citizen | Route Selection ("Start Navigation") | Flood Sheet Modal, Reroute Option, Home |
| 6 | **Flood Zone Hazard Sheet** | [`/citizen/hazard_sheet.html`](./frontend/citizen/hazard_sheet.html) | Citizen | Map Marker Tap / In-Page Sheet | Active Navigation, Emergency Assistance |
| 7 | **Emergency Assistance & SOS** | [`/citizen/sos.html`](./frontend/citizen/sos.html) | Citizen | Red SOS FAB | Direct 911/EOC Beacon, Citizen Home |
| 8 | **Report Hazard Flow** | [`/citizen/report.html`](./frontend/citizen/report.html) | Citizen | Citizen Nav Bar | Citizen Home |
| 9 | **Gov Command Center Overview** | [`/government/overview.html`](./frontend/government/overview.html) | Government | Login / Gov Side Rail | Zone Detail Panel (`/government/zone_detail.html`), Response Center (`/government/response_center.html`) |
| 10 | **Response Center & Incidents** | [`/government/response_center.html`](./frontend/government/response_center.html) | Government | Gov Overview / Gov Side Rail | "Dispatch Team" -> Rescue Mission Detail (`/rescue/mission_detail.html`) |
| 11 | **Zone Detail & Cascade Impact** | [`/government/zone_detail.html`](./frontend/government/zone_detail.html) | Government | Gov Map Zone Click / Rail | Gov Response Center, Mobile Tactical Map |
| 12 | **Disaster Simulator** | [`/government/simulator.html`](./frontend/government/simulator.html) | Government | Gov Side Rail | Command Overview, Zone Detail |
| 13 | **Critical Asset Monitor** | [`/government/critical_assets.html`](./frontend/government/critical_assets.html) | Government | Gov Side Rail | Historical Hotspots, Response Center |
| 14 | **Gov Mobile Tactical Stack** | [`/government/mobile_map.html`](./frontend/government/mobile_map.html) | Government | Gov Mobile Nav / Rail | Incident Triage (`/government/mobile_triage.html`) |
| 15 | **Gov Mobile Incident Triage** | [`/government/mobile_triage.html`](./frontend/government/mobile_triage.html) | Government | Gov Mobile Stack | Dispatch Modal -> Rescue Mission |
| 16 | **Gov Field Tasks & Deployment** | [`/government/mobile_tasks.html`](./frontend/government/mobile_tasks.html) | Government | Gov Mobile Nav | Field Unit Audit |
| 17 | **Rescue Home & Tactical Map** | [`/rescue/home.html`](./frontend/rescue/home.html) | Rescue | Login / Rescue Nav | Mission Detail (`/rescue/mission_detail.html`), Active Mission Nav |
| 18 | **Rescue Mission Detail & Dossier**| [`/rescue/mission_detail.html`](./frontend/rescue/mission_detail.html) | Rescue | Gov Dispatch Hand-Off / Rescue Home | "Start Mission" -> Active Mission Nav (`/rescue/active_nav.html`) |
| 19 | **Rescue Active Mission Nav** | [`/rescue/active_nav.html`](./frontend/rescue/active_nav.html) | Rescue | Mission Detail ("Start Mission") | "Submit Update" -> Status Report (`/rescue/status_report.html`) |
| 20 | **Rescue Hazard Risk Detail** | [`/rescue/hazard_detail.html`](./frontend/rescue/hazard_detail.html) | Rescue | Rescue Tactical Map | Mission Dossier |
| 21 | **Mission Status & Reporting** | [`/rescue/status_report.html`](./frontend/rescue/status_report.html) | Rescue | Active Mission Nav | Resolution Verified / Rescue Home |
| 22 | **Tablet Command Console** | [`/rescue/command_console.html`](./frontend/rescue/command_console.html) | Rescue | Rescue Nav Bar | Tactical Radar, Mission Logs |

---

## 3. Rehearsed 60-Second Judge Demo Path

```text
Login Screen (login.html)
  │
  ├──► [1. Citizen Persona]
  │      └─► Citizen Home (home.html)
  │            └─► Route Selection (route_selection.html)
  │                  └─► Flood Hazard Sheet Modal
  │                        └─► Active Navigation & Reroute (active_nav.html)
  │
  ├──► [2. Government EOC Persona]
  │      └─► Command Center Overview (overview.html)
  │            └─► In-Page Zone Detail Sliding Panel (zone_detail.html)
  │                  └─► Response Center & Incident Matrix (response_center.html)
  │                        └─► Trigger "Dispatch Team" (Dispatched Pill State)
  │
  └──► [3. Rescue Tactical Hand-Off]
         └─► Rescue Mission Dossier (mission_detail.html)
               └─► Start Mission Navigation (active_nav.html)
                     └─► Submit Field Status Report (status_report.html) [VERIFIED / RESOLVED]
```
