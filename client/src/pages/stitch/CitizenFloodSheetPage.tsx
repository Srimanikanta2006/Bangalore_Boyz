import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { Mock } from '../../components/stitch/Mock';

export const CitizenFloodSheetPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isRestricted, setIsRestricted] = useState(false);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [routeSuccess, setRouteSuccess] = useState(false);

  const handleSafeRoute = () => {
    setCalculatingRoute(true);
    setTimeout(() => {
      setCalculatingRoute(false);
      setRouteSuccess(true);
      setTimeout(() => {
        navigate('/citizen/routes');
      }, 1000);
    }, 900);
  };

  const handleToggleAvoid = () => {
    setIsRestricted(!isRestricted);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header with Back Button */}
      <Header
        title="Hazard Sheet"
        subtitle="ClimateShield Citizen"
        hasBack={true}
        onBack={() => navigate('/citizen/map')}
      />

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full relative select-none">
          {/* Map Simulation Viewport */}
          <div className="relative w-full h-[460px] overflow-hidden bg-surface-container-low">
            {/* Map Background Canvas */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              data-location="Downtown Houston, Texas Buffalo Bayou flood district"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAoKsL583yl1zE6HpAIdBCVXmngZJsm1nKwbHsRApc6ek8oWBHKlTDsZgmueXNbb4wUB6kdCOcWuxfl3P7AHlCnMoKthn91MpR9MBGX9t5qePmLtV4zAOjNv4Mbgeb6HbXRuVvYWAyREbINvTLR0Vqs-vMvuMYeD5dsGYZCPTCFKFWNubUbFfh22ouA6tXqk32aXGl7Tx2xFIYbgzOK7WW5wVwFsg7M-Qp8CuXteCHl1syYuN3oLYXL')`,
              }}
            ></div>

            {/* Technical Cartographic HUD Overlays */}
            <div className="absolute inset-0 bg-primary-container/25 pointer-events-none"></div>

            {/* Active Flood Vector Area Simulation (Cyan/Red Hazard Overlay) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-space-md">
              <svg
                className="w-full h-full max-w-sm opacity-90 drop-shadow-[0_0_16px_rgba(234,88,12,0.4)]"
                fill="none"
                viewBox="0 0 320 280"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Flood Inundation Contour */}
                <path
                  d="M 40,80 Q 90,40 160,70 T 270,90 Q 300,160 250,220 T 140,240 Q 60,230 45,170 Z"
                  fill="rgba(6,182,212,0.22)"
                  stroke="#06B6D4"
                  strokeDasharray="4 3"
                  strokeWidth="2"
                />
                <path
                  d="M 70,105 Q 110,80 160,95 T 235,115 Q 260,160 220,195 T 130,205 Q 80,200 65,150 Z"
                  fill="rgba(234,88,12,0.28)"
                  stroke="#EA580C"
                  strokeWidth="2.5"
                />

                {/* Center Incident Marker Beacon */}
                <g className="animate-pulse">
                  <circle cx="160" cy="145" fill="rgba(234,88,12,0.2)" r="28" />
                  <circle cx="160" cy="145" fill="#EA580C" r="14" />
                  <circle cx="160" cy="145" fill="#ffffff" r="5" />
                </g>

                {/* Depth Sounding Pins */}
                <g transform="translate(195, 115)">
                  <rect fill="#131b2e" height="22" rx="4" width="52" />
                  <text fill="#ffffff" fontFamily="Manrope" fontSize="10" fontWeight="700" textAnchor="middle" x="26" y="15">
                    120 mm
                  </text>
                </g>

                <g transform="translate(75, 165)">
                  <rect fill="#131b2e" height="22" rx="4" width="68" />
                  <text fill="#acedff" fontFamily="Manrope" fontSize="10" fontWeight="700" textAnchor="middle" x="34" y="15">
                    Flow: 2.8m/s
                  </text>
                </g>
              </svg>
            </div>

            {/* Quick Floating Telemetry Pills (Top Over Map) */}
            <div className="absolute top-space-sm left-space-md right-space-md flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-space-2xs px-space-xs py-space-2xs rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping"></span>
                <span className="font-code-sm text-code-sm font-bold text-on-surface">
                  <Mock label="Sector ID">SECTOR 04-B</Mock>
                </span>
              </div>
              <div className="flex items-center gap-space-2xs px-space-xs py-space-2xs rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-secondary">satellite_alt</span>
                <span className="font-code-sm text-code-sm font-semibold text-on-surface">
                  <Mock label="Sync Rate">RADAR SYNC: 14s AGO</Mock>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Bottom Sheet (Snap Half-State: ~45% screen height feel) */}
          <div
            className="relative -mt-10 rounded-t-[24px] bg-surface-container-lowest shadow-[0_-8px_30px_rgba(15,23,42,0.12)] flex flex-col z-20 transition-all duration-300"
            id="floodBottomSheet"
          >
            {/* Drag Pill Indicator Bar */}
            <div className="w-full flex items-center justify-center pt-space-xs pb-space-2xs cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-surface-container-highest"></div>
            </div>

            {/* Header Block with Left Edge Color Accent Bar */}
            <div className="relative px-space-md pt-space-xs pb-space-sm flex flex-col">
              {/* Left Edge Accent Bar for High Severity */}
              <div className="absolute left-0 top-3 bottom-2 w-1.5 bg-[#EA580C] rounded-r"></div>

              {/* Pill Badges & Risk Score Row */}
              <div className="flex items-center justify-between gap-space-xs pl-space-xs">
                <div className="flex items-center gap-space-xs flex-wrap">
                  {/* Severity Pill Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFEDD5] text-[#C2410C]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                      High Severity
                    </span>
                  </div>

                  {/* Hazard Type Chip */}
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface">
                    <span
                      className="material-symbols-outlined text-[14px] text-[#06B6D4]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      water_drop
                    </span>
                    <span className="font-label-sm text-label-sm font-semibold">Flash Inundation</span>
                  </div>
                </div>

                {/* Risk Score Tabular Metric */}
                <div className="flex items-baseline gap-0.5 shrink-0 bg-surface-container-low px-space-xs py-1 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">RISK</span>
                  <span className="font-data-metric-md text-data-metric-md text-[#EA580C] tracking-tight ml-1 font-bold">
                    <Mock label="Risk Metric">82</Mock>
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">/100</span>
                </div>
              </div>

              {/* Sector Name & Rapid Timestamp */}
              <div className="mt-space-xs pl-space-xs flex items-center justify-between">
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                  <Mock label="Corridor Name">Bayou Crossing Corridor</Mock>
                </h2>
                <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
                  <Mock label="Elapsed Time">UPDATED 1m AGO</Mock>
                </span>
              </div>

              {/* Cause Summary Line */}
              <div className="mt-space-2xs pl-space-xs flex items-start gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#EA580C] shrink-0 mt-0.5">warning</span>
                <p className="font-body-md text-body-md leading-snug">
                  Heavy runoff exceeding storm drainage capacity.{' '}
                  <span className="text-[#EA580C] font-semibold">Peak surge expected in 18 min.</span>
                </p>
              </div>
            </div>

            {/* Impact Metrics Cards Row */}
            <div className="px-space-md py-space-xs grid grid-cols-3 gap-space-xs">
              {/* Metric 1: Road Inundation */}
              <div className="bg-surface-container-low rounded-xl p-space-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm font-bold">ROAD CUT</span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
                </div>
                <div className="mt-space-xs">
                  <span className="font-data-metric-md text-data-metric-md text-on-surface font-bold">
                    <Mock label="Road Distance">2.4</Mock>
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant ml-0.5">km</span>
                </div>
                <span className="font-label-sm text-label-sm text-error mt-0.5 font-semibold truncate">
                  Impacting Loop 610
                </span>
              </div>

              {/* Metric 2: Water Depth */}
              <div className="bg-surface-container-low rounded-xl p-space-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm font-bold">MAX DEPTH</span>
                  <span className="material-symbols-outlined text-[16px] text-[#06B6D4]">waves</span>
                </div>
                <div className="mt-space-xs">
                  <span className="font-data-metric-md text-data-metric-md text-on-surface font-bold">
                    <Mock label="Water Depth">120</Mock>
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant ml-0.5">mm</span>
                </div>
                <span className="font-label-sm text-label-sm text-[#C2410C] mt-0.5 font-semibold truncate">
                  +15mm / 10min
                </span>
              </div>

              {/* Metric 3: Critical Access Restriction */}
              <div className="bg-surface-container-low rounded-xl p-space-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm font-bold">CRITICAL</span>
                  <span className="material-symbols-outlined text-[16px] text-error">local_hospital</span>
                </div>
                <div className="mt-space-xs">
                  <span className="font-label-md text-label-md text-error font-bold leading-tight line-clamp-2">
                    Hospital Route
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
                  St. Jude Gate B
                </span>
              </div>
            </div>

            {/* Live Evacuation & Relief Post Status Strip */}
            <div className="px-space-md py-space-xs">
              <div className="bg-surface-container rounded-lg p-space-xs flex items-center justify-between">
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">shield</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm font-bold text-on-surface truncate">
                      <Mock label="Shelter Landmark">St. Jude Emergency Evacuation Gate</Mock>
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Direct ambulance diversion enabled via North Spur
                    </span>
                  </div>
                </div>
                <button
                  aria-label="Route information"
                  className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm shrink-0"
                  type="button"
                  onClick={() => navigate('/citizen/routes')}
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Operational Action Buttons Docked at Bottom */}
            <div className="px-space-md pt-space-xs pb-space-lg flex flex-col gap-space-xs bg-surface-container-lowest">
              {/* Secondary Outline / Avoid Button */}
              <button
                className={`w-full h-11 rounded-lg font-body-md text-body-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${
                  isRestricted
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                }`}
                id="avoidBtn"
                type="button"
                onClick={handleToggleAvoid}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isRestricted ? 'check' : 'block'}
                </span>
                <span>{isRestricted ? 'Marked as Restricted Route' : 'Avoid this area'}</span>
              </button>

              {/* Primary Operational Action (Strict Rule: Single Solid Primary button) */}
              <button
                className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-body-md text-body-md font-semibold flex items-center justify-center gap-space-xs shadow-md transition-all active:scale-[0.99]"
                id="safeRouteBtn"
                type="button"
                onClick={handleSafeRoute}
              >
                {calculatingRoute ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Calculating Safe Corridor...</span>
                  </>
                ) : routeSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">check_circle</span>
                    <span>Rerouting Active (ETA +4m)</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">navigation</span>
                    <span>Find Safe Route</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
