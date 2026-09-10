import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { Mock } from '../../components/stitch/Mock';

export const ActiveNavPage: React.FC = () => {
  const navigate = useNavigate();
  const { routeId } = useParams<{ routeId: string }>();

  const [rerouteVisible, setRerouteVisible] = useState(true);
  const [missionStage, setMissionStage] = useState<'en_route' | 'on_scene' | 'triage' | 'cleared'>('en_route');
  const [isFabPulsing, setIsFabPulsing] = useState(false);

  const handleArrival = () => {
    const confirmArrival = window.confirm('Confirm tactical rig arrival at 412 Bayshore Blvd?');
    if (confirmArrival) {
      setMissionStage('on_scene');
      alert('Alpha-02 Rig marked ON SCENE. Tactical Command notified. Unlocking Triage checklist.');
    }
  };

  const handleReportHazard = () => {
    navigate('/rescue/report');
  };

  const handleRecenter = () => {
    setIsFabPulsing(true);
    setTimeout(() => setIsFabPulsing(false), 300);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header with Back Button and Rig Callout */}
      <Header
        title="Active Navigation"
        subtitle="ClimateShield Rescue"
        hasBack={true}
        onBack={() => navigate(-1)}
        rightElement={
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
              <Mock label="Unit Callout">Alpha-02</Mock>
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        }
      />

      {/* Main Viewport */}
      <main className="flex flex-col relative w-full pt-16 bg-surface flex-grow">
        <div className="flex flex-col w-full relative select-none">
          {/* Pinned Operational Progress Stepper */}
          <div className="sticky top-0 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-sm px-edge-margin-mobile py-2.5">
            <div className="flex items-center justify-between relative max-w-md mx-auto">
              {/* Continuous Track Line */}
              <div className="absolute left-4 right-4 top-3.5 h-[2px] bg-surface-container-highest -z-0"></div>
              {/* Active Progress Filled Line */}
              <div
                className="absolute left-4 top-3.5 h-[2px] bg-secondary -z-0 transition-all duration-300"
                style={{
                  width:
                    missionStage === 'en_route'
                      ? '16%'
                      : missionStage === 'on_scene'
                      ? '50%'
                      : missionStage === 'triage'
                      ? '80%'
                      : '100%',
                }}
              ></div>

              {/* Stage 1: En Route */}
              <div
                className={`flex flex-col items-center gap-1 z-10 cursor-pointer ${
                  missionStage === 'en_route' ? '' : 'opacity-70'
                }`}
                onClick={() => setMissionStage('en_route')}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center relative ${
                    missionStage === 'en_route'
                      ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[15px]"
                    style={missionStage === 'en_route' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    near_me
                  </span>
                  {missionStage === 'en_route' && (
                    <>
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim animate-ping"></span>
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim"></span>
                    </>
                  )}
                </div>
                <span
                  className={`font-label-sm text-label-sm tracking-tight ${
                    missionStage === 'en_route' ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
                >
                  En Route
                </span>
              </div>

              {/* Stage 2: On Scene */}
              <div
                className={`flex flex-col items-center gap-1 z-10 cursor-pointer ${
                  missionStage === 'on_scene' ? '' : 'opacity-70'
                }`}
                onClick={() => setMissionStage('on_scene')}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    missionStage === 'on_scene'
                      ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">pin_drop</span>
                </div>
                <span
                  className={`font-label-sm text-label-sm ${
                    missionStage === 'on_scene' ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
                >
                  On Scene
                </span>
              </div>

              {/* Stage 3: Triage */}
              <div
                className={`flex flex-col items-center gap-1 z-10 cursor-pointer ${
                  missionStage === 'triage' ? '' : 'opacity-70'
                }`}
                onClick={() => setMissionStage('triage')}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    missionStage === 'triage'
                      ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">medical_services</span>
                </div>
                <span
                  className={`font-label-sm text-label-sm ${
                    missionStage === 'triage' ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
                >
                  Triage
                </span>
              </div>

              {/* Stage 4: Cleared */}
              <div
                className={`flex flex-col items-center gap-1 z-10 cursor-pointer ${
                  missionStage === 'cleared' ? '' : 'opacity-70'
                }`}
                onClick={() => setMissionStage('cleared')}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    missionStage === 'cleared'
                      ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">task_alt</span>
                </div>
                <span
                  className={`font-label-sm text-label-sm ${
                    missionStage === 'cleared' ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
                >
                  Cleared
                </span>
              </div>
            </div>
          </div>

          {/* Full-bleed Tactical Map View Container */}
          <div className="relative w-full h-[512px] overflow-hidden bg-surface-dim">
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              data-location="Bayshore Boulevard Coastal Marsh Corridor"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzCVuM_w_tNQyQUy1juDIi6wI6lV2O31K1mKRbKujNmvW7sXxdyM72ohBjn03L368TFzVwkRlRxKzrGtoYAN-pa-qjjNxP8yL3EJ5f63_FjmMc_5an8_bGQg_rs3T1E2s6WHrBressPjJqnawKiQY_3a_u0pMHQdfqfnBz4PV6EJ0DRP2ezQxrIh515bMi4PSjMRK493RaYJWCgqhDo_suVrdfenAEHNwjUWRpumrXVNzFEyIOi4fi')`,
              }}
            >
              {/* High-Contrast Vector Tactical Navigation Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="tacticalRouteGlow" x1="0%" x2="50%" y1="100%" y2="0%">
                    <stop offset="0%" stopColor="#0051d5" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#316bf3" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Flood Hazard Polygon */}
                <polygon fill="#acedff" fillOpacity="0.32" points="120,80 290,110 320,240 180,260 100,190" />
                <polygon fill="#4cd7f6" fillOpacity="0.45" points="135,95 270,120 300,225 190,245 115,180" />

                {/* Thermal / Surge Hazard Contour Ring */}
                <circle cx="210" cy="180" fill="#ffdad6" fillOpacity="0.4" r="62" />
                <circle cx="210" cy="180" fill="#ba1a1a" fillOpacity="0.25" r="38" />

                {/* Original Compromised Route Segment */}
                <path d="M 190 380 Q 205 270 210 180" fill="none" opacity="0.85" stroke="#ba1a1a" strokeDasharray="6,6" strokeWidth="4" />

                {/* Tactical Buffer */}
                <path d="M 190 380 C 185 320, 105 290, 85 200 S 140 90, 175 40" fill="none" stroke="#0051d5" strokeLinecap="round" strokeOpacity="0.2" strokeWidth="22" />

                {/* Primary Tactical Vector */}
                <path d="M 190 380 C 185 320, 105 290, 85 200 S 140 90, 175 40" fill="none" stroke="url(#tacticalRouteGlow)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" />
              </svg>
            </div>

            {/* Tactical Hazard Marker: Culvert 4 Surge Zone */}
            <div className="absolute top-[28%] right-[22%] -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error text-on-error shadow-lg animate-pulse">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                <Mock label="Breach Level">Breach +1.2m</Mock>
              </span>
            </div>

            {/* Live Position Marker: Alpha-02 Rig */}
            <div className="absolute bottom-[24%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-12 h-12 rounded-full bg-secondary-container/40 animate-ping"></span>
                <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-xl border-2 border-surface-container-lowest">
                  <span className="material-symbols-outlined text-[18px] rotate-[-28deg]">navigation</span>
                </div>
              </div>
              <div className="mt-1 px-2 py-0.5 rounded bg-primary-container text-on-primary font-code-sm text-code-sm font-semibold tracking-tight shadow-md">
                ALPHA-02 RIG
              </div>
            </div>

            {/* Destination Target Beacon */}
            <div className="absolute top-[8%] left-[44%] -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-on-primary shadow-xl">
              <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                location_on
              </span>
              <span className="font-label-sm text-label-sm font-bold tracking-tight">412 Bayshore (Rescue Zone)</span>
            </div>

            {/* Top Floating Tactical Map Controls */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
                <span className="font-label-sm text-label-sm font-bold text-on-surface tracking-tight">
                  CORRIDOR SAFE · MSL +16m
                </span>
              </div>
            </div>

            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
              <button
                aria-label="Recenter map"
                className="w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md flex items-center justify-center text-on-surface active:scale-95 transition-transform"
                type="button"
                onClick={handleRecenter}
              >
                <span className="material-symbols-outlined text-[18px]">my_location</span>
              </button>
              <button
                aria-label="Toggle hazard overlays"
                className="w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md flex items-center justify-center text-on-surface active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">layers</span>
              </button>
            </div>

            {/* Tactical Obstacle Toast Banner (Floating over Map) */}
            {rerouteVisible && (
              <div className="absolute top-14 inset-x-3 z-20 transition-all duration-300 transform translate-y-0" id="rerouteToast">
                <div className="p-3.5 rounded-xl bg-primary-container text-on-primary shadow-xl">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-error text-on-error flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        crisis_alert
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-label-sm text-label-sm font-bold text-error-container tracking-wider uppercase">
                          Tactical Obstacle Detected
                        </span>
                        <span className="font-code-sm text-code-sm text-on-primary-container">450m ahead</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-surface-container-low leading-snug">
                        Culvert 4 breached (+1.2m surge). Auto-rerouted via{' '}
                        <span className="font-semibold text-tertiary-fixed">Ridgeview Bypass</span> (+1.4 min safe MSL).
                      </p>
                      <div className="mt-2.5 flex items-center justify-end gap-2">
                        <button
                          className="px-3 py-1 rounded-full text-on-primary hover:bg-surface-container-highest/20 font-label-sm text-label-sm transition-colors"
                          type="button"
                          onClick={() => setRerouteVisible(false)}
                        >
                          Dismiss
                        </button>
                        <button
                          className="px-3.5 py-1 rounded-full bg-secondary-container text-on-secondary font-label-sm text-label-sm font-semibold shadow-sm active:scale-95 transition-transform flex items-center gap-1"
                          type="button"
                          onClick={() => setRerouteVisible(false)}
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Accept Route
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Metrics Docked Sheet */}
          <div className="relative w-full -mt-4 bg-surface-container-lowest rounded-t-2xl shadow-xl px-edge-margin-mobile pt-3 pb-8 z-20">
            <div className="w-10 h-1 rounded-full bg-surface-variant mx-auto mb-3"></div>

            {/* Primary Turn Directive Card */}
            <div className="p-3.5 rounded-xl bg-surface-container-low mb-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[28px]">turn_left</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-data-metric-md text-data-metric-md text-secondary">
                    <Mock label="Next Distance">In 320m</Mock>
                  </span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface font-semibold">
                    SAFE ELEVATION
                  </span>
                </div>
                <p className="font-title-lg text-title-lg text-on-surface truncate">
                  <Mock label="Next Instruction">Turn Left onto Highline Elevation Ramp</Mock>
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Elevation: <span className="text-on-tertiary-container font-bold">+16m MSL</span> (Dry corridor)
                </p>
              </div>
            </div>

            {/* Core Telemetry Triad (ETA | Remaining | Target) */}
            <div className="grid grid-cols-3 gap-2 py-2 mb-3">
              <div className="flex flex-col p-2.5 rounded-lg bg-surface">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">ETA</span>
                <span className="font-data-metric-lg text-data-metric-lg text-on-surface tracking-tight mt-0.5">
                  <Mock label="ETA Time">04:18</Mock>
                </span>
                <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">On Schedule</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-lg bg-surface">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Remaining</span>
                <span className="font-data-metric-lg text-data-metric-lg text-on-surface tracking-tight mt-0.5">
                  <Mock label="Distance Left">1.1</Mock>{' '}
                  <span className="font-title-lg text-title-lg text-on-surface-variant font-normal">km</span>
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">Bypass Clear</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-lg bg-surface">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Target Zone</span>
                <span className="font-body-md text-body-md font-bold text-on-surface truncate mt-1">412 Bayshore</span>
                <span className="font-label-sm text-label-sm text-error font-semibold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>{' '}
                  <Mock label="Victim Count">4 Trapped</Mock>
                </span>
              </div>
            </div>

            {/* Secondary Hazard Telemetry Card */}
            <div className="p-3 rounded-lg bg-surface-container mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">water</span>
                </div>
                <div>
                  <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                    <Mock label="Telemetry Sensor">Telemetry Sensor S-08 (Marsh Drain)</Mock>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    Flow rate: 3.4 m/s · Sump level: Stable
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-code-sm text-code-sm font-bold shadow-sm">
                <Mock label="Water Level">0.8m Dep.</Mock>
              </span>
            </div>

            {/* Operational Action Buttons */}
            <div className="flex flex-col gap-2.5">
              {/* Primary Operational Button */}
              <button
                className="w-full h-11 rounded-lg bg-primary text-on-primary font-title-lg text-title-lg font-semibold shadow-md active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
                type="button"
                onClick={handleArrival}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span>Mark Arrived On Scene</span>
              </button>

              {/* Secondary Field Hazard Log */}
              <button
                className="w-full h-10 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium shadow-sm active:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                type="button"
                onClick={handleReportHazard}
              >
                <span className="material-symbols-outlined text-[18px] text-error">report_problem</span>
                <span>Report Road Hazard / Sump</span>
              </button>
            </div>
          </div>

          {/* Pinned Persistent Circular 'Navigate' FAB */}
          <div className="fixed bottom-24 right-4 z-40">
            <button
              aria-label="Center live navigation corridor"
              className={`w-14 h-14 rounded-full bg-secondary text-on-secondary shadow-xl flex flex-col items-center justify-center transition-transform ring-4 ring-secondary-fixed/40 ${
                isFabPulsing ? 'scale-95' : 'active:scale-90'
              }`}
              type="button"
              onClick={handleRecenter}
            >
              <span className="material-symbols-outlined text-[26px]">navigation</span>
              <span className="font-label-sm text-label-sm tracking-tighter uppercase font-bold text-[10px] leading-none">
                NAV
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
