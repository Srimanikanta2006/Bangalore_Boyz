# ClimateShield — 60-Second Judge Demo: Production Storyboard & Recording Spec

> **Format:** 1-take continuous narrative (1920×1080 Landscape / 1080×1920 Mobile cut available)  
> **Target Duration:** Exactly 60 seconds (9 timed beats)  
> **Narration Speed:** ~140 words total (~145–150 wpm crisp conversational delivery)  
> **Core Narrative Arc:** **Predict ➔ Act ➔ Respond ➔ Learn** (Closed-Loop Resilience)

---

## 1. Master Timed Storyboard & Screen Mapping

| Beat & Timestamp | Screen Placeholder ID & Title | Visual Action & Cursor Choreography | Bottom-Third Caption Overlay | Spoken Narration Script |
| :--- | :--- | :--- | :--- | :--- |
| **Beat 1**<br>`0:00 – 0:04`<br>*(4 sec)* | `{{DATA:SCREEN:SCREEN_42}}`<br>**ClimateShield — Login & Role Preview** | Static establishing shot; subtle scale zoom (100% ➔ 104%). Center logo pulse. | `ClimateShield — Climate Risk & Response Platform` | *"This is ClimateShield."* |
| **Beat 2**<br>`0:04 – 0:10`<br>*(6 sec)* | `{{DATA:SCREEN:SCREEN_40}}`<br>**Citizen — Home & Live Map** | Tap cursor simulates clicking search bar, typing *"North General Trauma"*. Horizontal route cards slide in. | `Citizen — "Can I get there safely?"` | *"A citizen searches for the hospital. ClimateShield doesn't just find the fastest route — it scores every route for climate risk."* |
| **Beat 3**<br>`0:10 – 0:16`<br>*(6 sec)* | `{{DATA:SCREEN:SCREEN_39}}`<br>**Citizen — Flood Zone Hazard Sheet** (and `{{DATA:SCREEN:SCREEN_37}}`) | Cursor clicks the pulsing flood sector on the live map; bottom hazard sheet slides up into half-sheet state (`Dynamic Risk: 82/100`). | `Flood Risk: HIGH · 82/100` | *"Real-time rainfall data shows a flood forming — 82 out of 100 risk, two roads affected."* |
| **Beat 4**<br>`0:16 – 0:22`<br>*(6 sec)* | `{{DATA:SCREEN:SCREEN_35}}`<br>**Citizen — Active Navigation & Dynamic Rerouting** | Quick punch zoom (110%) into route map; amber alert banner surfaces: *"Flood risk detected 800m ahead. Auto-adjusted via Highline Ridge (+2 min delta)."* | `Route automatically adjusted` | *"The moment the road becomes unsafe, the route reroutes itself — no app-switching, no manual check."* |
| **Beat 5**<br>`0:22 – 0:30`<br>*(8 sec)* | `{{DATA:SCREEN:SCREEN_27}}`<br>**Government — Command Center Overview** | Hard cut to high-density desktop command center. Cursor sweeps across EOC sensor telemetry tiles, then clicks the red inundated corridor in Sector 04-B. | `Government — "What's at risk, and why?"` | *"At the same moment, the city's command center sees it too — not just that there's a flood, but exactly what it threatens."* |
| **Beat 6**<br>`0:30 – 0:38`<br>*(8 sec)* | `{{DATA:SCREEN:SCREEN_23}}`<br>**Government — Zone Detail & Cascade Impact** | 420px right-docked drawer pushes the map. Cursor scrolls top-to-bottom through the 4-step cascade chain (`Rainfall ➔ Sump Deficit ➔ Arterial Inundation ➔ Ambulance Diverted`). | `Cascade Analysis: Inundation ➔ Hospital Ingress Severed` | *"It shows the cascade: rain overflows the drains, blocks the road, and cuts off hospital access — before it becomes a crisis."* |
| **Beat 7**<br>`0:38 – 0:44`<br>*(6 sec)* | `{{DATA:SCREEN:SCREEN_19}}`<br>**Government — Response Center & Incident Management** | Cursor clicks solid primary CTA `Assign Team` on Incident `#INC-204`; modal snaps in; single tap on `Dispatch Team`. | `Incident #INC-204 ➔ Dispatched` | *"One click dispatches the response team — no phone trees, no delay."* |
| **Beat 8**<br>`0:44 – 0:52`<br>*(8 sec)* | `{{DATA:SCREEN:SCREEN_8}}`<br>**Rescue — Active Mission Navigation** (and `{{DATA:SCREEN:SCREEN_10}}`) | Quick cut to field mobile unit. Mission `#MIS-104` dossier loads with live hydro metrics; cursor clicks `Accept & Start`; switches to tactical waypoint navigation with persistent top stepper. | `Rescue — "Get there, safely, fast."` | *"The rescue team receives the mission instantly, with the safest possible route to the hospital — not just the shortest."* |
| **Beat 9**<br>`0:52 – 0:57`<br>*(5 sec)* | `{{DATA:SCREEN:SCREEN_4}}`<br>**Rescue — Mission Status Update & Reporting** (and `{{DATA:SCREEN:SCREEN_25}}`) | Field Sitrep logs extraction verified (`Verified ✓`). Immediate cut to `Critical Asset Monitor` showing St. Jude Gate B restored to nominal status. | `Incident Verified ✓ — Logged for the future` | *"Once resolved, ClimateShield remembers — so next time, the city fixes the drain before it floods at all."* |
| **Beat 10 (End)**<br>`0:57 – 1:00`<br>*(3 sec)* | `{{DATA:IMAGE:IMAGE_43}}`<br>**Brand Mark & Final Screen** | Hold on clean Slate-900 / Cyan gradient end card. Centered ClimateShield mark. Tagline fades in. | `Predict. Act. Respond. Learn.` | *"ClimateShield: one platform, three roles, one city that gets safer every time."* |

---

## 2. Audio & Sound Design Blueprint

- **Voiceover Track:** Single articulate, energetic voiceover recorded with a broadcast microphone (compression + high-pass filter at 80Hz). Spoken with crisp conviction at ~145–150 wpm.
- **Ambient Sound Bed:** Soft, high-tech emergency operations center / telemetry background hum (low-pass filtered at 1kHz, mixed low at `-28dB to -32dB` so voiceover remains crystal clear).
- **Foley & UI SFX Triggers:**
  - `0:16` — Subtle digital "chime / re-route" notification tick when the citizen's route auto-adjusts.
  - `0:22` — Deep ambient bass drop / sub-tick transitioning from Citizen mobile into Government desktop.
  - `0:42` — Satisfying tactile mechanical dispatch "click" on the EOC dispatch trigger.
  - `0:54` — Clean high-clarity harmonic "Confirmed ✓" sound effect on Sitrep EOC verification.

---

## 3. Motion & Screen Recording Execution Directives

1. **Ken Burns Motion on Static Canvases:** Apply a 104–108% subtle digital push on wide desktop screens (`SCREEN_27`, `SCREEN_23`, `SCREEN_19`) to keep frames dynamic.
2. **Micro-Punches (150ms ease-out):** When pointing out specific metrics (e.g., `82/100` Hazard Score, `04:12 SLA`, or `1.4m Depth`), snap in 120% with a circular cursor tap ripple.
3. **Bottom-Third Styling Rules:**
   - Background: Dark glassmorphism (`rgba(15, 23, 42, 0.85)` with `backdrop-filter: blur(12px)`).
   - Left Accent Bar (4px solid):
     - Beats 2–4 (Citizen): Cyan `#06B6D4` / Emerald `#10B981`
     - Beats 5–7 (Government): Deep Navy `#0F172A` / Crimson `#DC2626`
     - Beats 8–9 (Rescue): High-vis Red `#E11D48`
