# ClimateShield System Master Briefing & Architecture Guide

## Executive Summary
ClimateShield is a complete, multi-tenant B2G and B2B Climate Risk, Flood Resilience, and Tactical Rescue Dispatch Platform. It provides an end-to-end operational pipeline connecting **Citizens**, **Government Command HQ (EOC)**, **Field Rescue Taskforces**, and **Commercial Enterprise Partners**.

---

## 1. Core Architecture & Multi-Region Support

### Dynamic Region Engine
All screens dynamically adapt data, maps, telemetry sensors, and active incidents based on the active region state (`localStorage` + `climateshield_region_changed` event):
- **🇳🇵 Nepal (Kathmandu Flood Basin)**: Real GIS coordinates for Bagmati River, Kantipath Lowland Corridor, Balkhu Highway Interchange, and Tribhuvan Emergency Hub.
- **🇮🇳 Chennai (East Basin Flood Zone)**: Real GIS coordinates for Bayou Culvert D07, Substation 9, and St. Jude Regional Trauma Center.
- **📍 Live GPS**: Real browser geolocation mode centering maps dynamically on user coordinates.

---

## 2. Module Walkthrough: How Everything Works

### A. Citizen Experience (`/citizen/map`, `/citizen/routes`, `/citizen/navigate`, `/citizen/sos`)
1. **Interactive Real Street Map**: Built on OpenStreetMap Street Mode (`tileTheme="osm"`), rendering actual buildings, street names, and topography.
2. **Safe Route Calculation**: Citizens can enter custom start/destination locations or select presets (e.g. Nepal Kathmandu flood bypass). The routing engine calculates safe-elevation pathways avoiding active inundation zones.
3. **One-Touch SOS Emergency**: Broadcasts citizen location, victim count, and water depth directly to the Government Command Center and nearest Rescue Units.

### B. Government HQ Command Center (`/gov/overview`, `/gov/incidents`, `/gov/zone-cascade/:id`, `/gov/critical-assets`, `/gov/simulator`, `/gov/commercial`)
1. **Live Map & Cascade Intelligence (`/gov/zone-cascade/:id`)**:
   - Renders street-following polylines along real road curves (no straight lines across buildings).
   - Features zero-overlap HUD element stacking: Top bar displays Grid Status & Weather; bottom-left shows compromise cards; bottom-right hosts the Map Style Switcher (`Street`, `Esri City`, `Dark`).
2. **Dedicated Incidents History (`/gov/incidents`)**:
   - Separated from the Response Center page to eliminate route collisions. Displays historical (2024–2026) and active disaster audit logs with filter and search capabilities.
3. **Infrastructure Readiness & Report Downloads (`/gov/critical-assets`)**:
   - Region-aware asset tracking (e.g. *Tribhuvan Medical Hub*, *Bagmati Main Bridge*).
   - **Generate Vulnerability Report**: Downloads structured JSON vulnerability audits.
   - **Export SITREP**: Generates situational report JSON payload for emergency agency sharing.
4. **CAD Disaster Simulator (`/gov/simulator`)**:
   - Simulates 100-Yr Atmospheric River scenarios and stress-tests drainage throughput.
5. **Business Expansion & Commercial Revenue Hub (`/gov/commercial`)**:
   - Tiered INR (₹) subscription plans (₹1,499 / ₹3,999 / ₹11,990), usage sliders, partner risk API generator, and ISO-14090 ESG compliance export.

### C. Rescue Tactical Operations (`/rescue/tactical`, `/rescue/navigate/:id`, `/rescue/console`)
1. **Department Credential Verification**: Displays `Dept Verified: Fire & Emergency #FR-8821` security seals to verify officer identity.
2. **Department Vehicle Units**: Specialized callouts for Fire Rigs 🚛, Police Patrol Cruisers 🚓, and ALS Ambulances 🚑.
3. **Turn-by-Turn Active Navigation**: Displays street-following route polyline directions with real-time hazard warnings.
4. **Un-Congested Action Layout**: Guaranteed right-padding spacing (`pr-14`) between primary action buttons (`Mark Arrived On Scene`) and floating `NAV` FABs.

---

## 3. Phase 3 & Integration Deliverables
- [x] **Phase 3 Batch 1: Security Foundation** — Tiered rate limiting (`express-rate-limit`), object-level auth on citizen reports/SOS, sanitized error handlers, hardened Helmet headers, seamless role sync.
- [x] **Phase 3 Batches 2 & 3: Reliability & Integrity** — External API resilience (Open-Meteo retry/fallback with freshness flags), rolling-window deduplication & `Idempotency-Key` headers, atomic Prisma transactions, audit logging (`AuditLog.metadata`), and alert delivery lifecycle.
- [x] **Phase 3 Batches 4 & 5: Observability & Async Event Outbox** — Trace ID propagation, `/health/live`, `/health/ready`, `/metrics`, and transactional `EventOutbox` worker.
- [x] **Supabase PostgreSQL & Cloud Deployment** — Supabase transaction pooler setup, Prisma 5/5 migrations applied, complete synthetic seed applied, Render backend blueprint (`render.yaml`), Vercel SPA routing (`client/vercel.json`), and 12/12 E2E integration audit passed.

---

## 4. System Verification & Build Integrity
- **Vite & TypeScript Compilation**: 100% clean production build (`npm --prefix client run build`) with **0 errors**.
- **Backend Unit & Integration Tests**: 21/21 test files passed, 163/163 executable tests passed.
- **End-to-End Audit**: 12/12 steps passed (100% success rate).
- **Supabase Database**: Connected & Seeded via `aws-0-ap-northeast-1.pooler.supabase.com:6543`.
- **Git Branch**: All enhancements committed to `feature/climateshield-mvp`.
