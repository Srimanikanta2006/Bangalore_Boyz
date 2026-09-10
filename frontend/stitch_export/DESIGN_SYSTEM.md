---
name: Climate Resilience & Emergency Response
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001f26'
  on-tertiary-container: '#0090a9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  data-metric-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.03em
  data-metric-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.02em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  edge-margin-mobile: 1rem
  edge-margin-desktop: 1.5rem
  panel-width-sm: 20rem
  panel-width-md: 26rem
  panel-width-lg: 32rem
---

## Brand & Style

This design system delivers operational clarity under high-stress conditions. Built for emergency response coordinators, municipal resilience officers, and GIS field directors, the interface prioritizes immediate comprehension over decoration. 

The aesthetic is anchored in Swiss Modernism fused with technical cartographic precision. It borrows the structural utility and density of industrial intelligence platforms while retaining the ergonomic clarity, micro-interactions, and visual discipline of contemporary productivity tools. Every element exists on a deterministic scale: visual hierarchy communicates urgency instantly, geographic vectors remain pristine across zoom levels, and layout density never compromises rapid operational triage.

Key visual mandates:
- Zero decorative gradients, drop-shadow soup, or ambiguous visual artifacts.
- Explicit categorical separation between operational urgency and physical phenomenon classification.
- High contrast, tabular-aligned data arrays that eliminate ambiguity during incident escalations.

## Colors

The color system enforces a strict dual-track architectural model. Hazard Classification and Incident Severity must never share visual encodings or cross-pollinate within identical interactive contexts.

### Structural Neutrals
- **App Background**: `#F7F8FA` — ultra-light technical slate for minimal visual fatigue.
- **Surface Elevation**: `#FFFFFF` — crisp white card and floating sheet ground.
- **Border / Divider**: `#E2E8F0` — hairline 1px boundary definition for layout grid adherence.
- **Text Primary**: `#0F172A` — deep slate-900 providing AAA contrast against all surface backgrounds.
- **Text Secondary / Muted**: `#64748B` — slate-500 for descriptive metadata, unit labels, and secondary actions.

### Track 1: Operational Severity Tokens
Severity communicates triage state, threat level, and emergency escalation. These tokens override all hazard visuals when displaying priority queues, triage pins, and alerts:
- **Severity Safe**: `#16A34A` (Normal thresholds, verified cleared sectors)
- **Severity Info**: `#2563EB` (Standard advisory, watch mode, procedural log)
- **Severity Moderate**: `#D97706` (Advisory escalated, threshold warning)
- **Severity High**: `#EA580C` (Direct immediate threat, localized evacuation readiness)
- **Severity Critical**: `#DC2626` (Life safety threat, immediate mandatory intervention)

### Track 2: Physical Hazard Phenotype Tokens
Hazard tokens classify environmental sensor arrays, geospatial polygon overlays, and catalog metadata. They remain stable regardless of severity:
- **Hazard Flood**: `#06B6D4` (Hydrological events, storm surges, river basins)
- **Hazard Heat**: `#F97316` (Thermal anomalies, wet-bulb spikes, urban heat islands)
- **Hazard Landslide**: `#92400E` (Geotechnical instability, debris flows, slope failure)
- **Hazard Storm**: `#7C3AED` (Convective systems, wind shear, cyclones)
- **Hazard Snow/Ice**: `#64748B` (Atmospheric freezing, permafrost thaw, blizzard)

### Behavioral Rules
- Primary operational actions (dispatch, trigger, export) use `#0F172A` with `#FFFFFF` text.
- Secondary actions rely on subtle slate border strokes with `#0F172A` labels.
- Severity colors apply strictly to semantic indicators (dot statuses, pill fills, badge badges, critical boundary perimeters). They are never used as general button backgrounds except for destructive emergency overrides.

## Typography

The typographic system pairs the structural, confident geometry of **Plus Jakarta Sans** for navigation, cards, and modal titling with the rational, utilitarian clarity of **Manrope** for telemetry feeds, contextual descriptions, and interactive elements.

### Precision Data Rules
- **Tabular Figures**: All instances of `data-metric-lg`, `data-metric-md`, timestamps, coordinates (lat/long), population counts, and ETAs must utilize OpenType font features `font-feature-settings: "tnum" on, "cv05" on`. This guarantees rock-solid alignment during live data refresh cycles without layout oscillation.
- **Labels & Badges**: Micro-labels (`label-sm`, 11px) use explicit uppercase styling with `+0.04em` letter-spacing to ensure crisp legibility on dark cartographic surfaces and elevated cards.
- **Hierarchy Restraint**: Avoid decorative font sizes. High-level metric dashboards scale directly from `label-sm` (kicker) directly to `data-metric-lg` (value), keeping vertical footprint compact.

## Layout & Spacing

The layout model is anchored by a dynamic full-viewport geospatial canvas overlain with structured Swiss floating panels. Spatial rhythm adheres to a strict 4px base increment (using an 8px preferred module for structural containers).

### Form Factors & Breakpoints
- **Mobile (`< 768px`)**:
  - Full-screen base map canvas.
  - Floating bottom drawer sheet with fixed, collapsed state displaying incident counts and primary alert.
  - Bottom sheet expands via gesture to 50% or 92% screen height.
  - Edge safe margins: 16px (`1rem`).
  - Action footer: Sticky bottom container housing the single primary operational CTA.
- **Tablet (`768px - 1024px`)**:
  - Collapsible floating telemetry rail docked to the left edge with a 16px margin from viewport borders.
  - Contextual inspectors pop as floating popovers with automatic collision detection.
- **Desktop (`> 1024px`)**:
  - Continuous geospatial viewport.
  - Left Primary HUD (`panel-width-md`, 416px / `26rem`) floating 24px inset from viewport borders.
  - Right Contextual Inspector (`panel-width-lg`, 512px / `32rem`) sliding over the canvas on selection.
  - Global gutters: 16px (`1rem`) within cards; 24px (`1.5rem`) within panel containers.

### Spacing Token Rules
- Use `space-2xs` (4px) exclusively for micro-badge insets and inline dot-to-text separation.
- Use `space-xs` (8px) for list item density in tables and form field vertical flow.
- Use `space-md` (16px) for internal padding on floating cards, modal interiors, and stack groupings.
- Use `space-lg` (24px) for major module separation within analytical sidebars.

## Elevation & Depth

Visual depth is achieved through high-performance surface separation that does not muddy analytical cartography beneath it.

### Elevation Hierarchy
- **Level 0 (Base Canvas)**: Full bleed interactive GIS map canvas (`#F7F8FA` water/land styling).
- **Level 1 (Structural Rail / Canvas Containers)**: Solid `#FFFFFF` fill with a crisp 1px hairline border in `#E2E8F0`. Zero shadow. Used for docked persistent toolbars and table structures.
- **Level 2 (Floating Analytics Cards & Sheets)**: Solid `#FFFFFF` surface with hairline outline (`1px solid #E2E8F0`) backed by a soft, highly-diffused ambient shadow:
  `box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08);`
  This delivers tactile separation from underlying topographic line work without muddying map labels.
- **Level 3 (Modal Alerts & Emergency Overrides)**: Raised contextual overlays:
  `box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.14);`
  Combined with a subtle neutral backdrop tint (`rgba(15, 23, 42, 0.40)`) with a 4px blur filter (`backdrop-filter: blur(4px)`).

### Ghost Outlines & Micro Borders
Every elevated card must carry a 1px border (`#E2E8F0`). Under no circumstance should a card rely solely on a drop shadow for edge definition, ensuring maximum contrast on heterogeneous cartographic surfaces.

## Shapes

The shape architecture pairs structural operational discipline with soft geometric approachability.

- **Floating Panels & Cards**: 12px to 16px corner radius (`rounded-lg` to `rounded-xl`). Cards containing dense data lists default to 12px; floating window containers scale to 16px.
- **Form Controls & Inputs**: 8px corner radius (`rounded-md`), providing crisp alignment next to button triggers.
- **Pill Status Badges & Chips**: 999px corner radius (`rounded-full`). These enclose severity indicators, hazard markers, and filter tokens to visually differentiate meta-tags from actionable cards.
- **Map Vector Nodes & Geometry Markers**: Circular 50% radius for individual telemetry sensors and incident focal points; hexagonal outlines reserved specifically for automated cluster aggregates.

## Components

### Buttons
- **Primary Operational Action**: Solid `#0F172A` background, `#FFFFFF` text, font `Manrope` 14px semi-bold. Height: 40px (desktop), 44px (mobile). Border radius: 8px. Hover: `#1E293B`.
  *Rule*: There is strictly **one** solid primary button visible per active view/sheet to prevent ambiguity in critical workflows.
- **Secondary Action**: Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#0F172A`. Hover: `#F8FAFC`.
- **Destructive/Emergency Action**: Solid `#DC2626` background, `#FFFFFF` text. Used exclusively for emergency broadcast triggers, area evacuation declarations, or system overrides.
- **Icon Utility Buttons**: 36px x 36px, background `#FFFFFF`, border `1px solid #E2E8F0`, text `#64748B`. Hover text `#0F172A`.

### Status & Hazard Badges (Pills)
- Height: 24px. Border radius: 999px. Padding: 0 10px. Typographic style: `label-sm` (11px, semi-bold).
- **Severity Badges**:
  - Safe: Background `#DCFCE7`, text `#15803D`, dot `#16A34A`.
  - Info: Background `#DBEAFE`, text `#1D4ED8`, dot `#2563EB`.
  - Moderate: Background `#FEF3C7`, text `#B45309`, dot `#D97706`.
  - High: Background `#FFEDD5`, text `#C2410C`, dot `#EA580C`.
  - Critical: Background `#FEE2E2`, text `#B91C1C`, dot `#DC2626`.
- **Hazard Type Chips**:
  - Outlined style: Background `#FFFFFF`, 1px solid border matching the hazard token (e.g., `#06B6D4` for flood), text `#0F172A`, leading 6px filled square swatch.

### Floating Cards
- Built using `#FFFFFF` surface, `rounded-xl` (16px), 1px border `#E2E8F0`, ambient elevation shadow.
- Interior padding: 16px or 20px.
- Header composition: Category micro-kicker (`label-sm`, `#64748B`) paired with a right-aligned Severity Pill, followed by Title (`title-lg`, `#0F172A`) and tabular timestamp.

### Lists & Incident Feeds
- Row item height: 56px minimum for rapid selection.
- Inset hairline divider: `1px solid #F1F5F9`.
- Layout: Left severity status bar indicator (4px solid vertical bar along card edge), center title and metric readout, right chevron or elapsed delta (e.g., `+12m ago` using tabular font setting).
- Hover state: `#F8FAFC` transition (120ms ease-out). No scale transforms.

### Form Inputs & Selectors
- Height: 40px. Background: `#FFFFFF`. Border: `1px solid #CBD5E1`. Radius: 8px.
- Text: 14px `Manrope`. Placeholder: `#94A3B8`.
- Focus State: Border color `#0F172A`, subtle box shadow ring: `0 0 0 2px rgba(15, 23, 42, 0.1)`. No default browser blue rings.

### Checkboxes & Radio Controls
- Size: 16px x 16px.
- Unchecked: `#FFFFFF` fill with `1.5px solid #CBD5E1`.
- Checked: `#0F172A` fill with white indicator icon.
- Focus: Offset 2px slate ring.

### Sticky Sheet CTAs (Mobile Specific)
- Floating bottom bar locked directly above OS home indicator.
- Background: `#FFFFFF` with top border `1px solid #E2E8F0`.
- Padding: 12px 16px.
- Houses the single primary action button stretched full width (`w-full`), ensuring frictionless thumb-reach during one-handed field operation.