import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { fetchCitizenHazardDetail, type CitizenHazardDetail } from '../../citizen/api';
import { ApiError } from '../../lib/api';

const SEVERITY_META: Record<string, { label: string; bg: string; text: string; dot: string; bar: string }> = {
  CRITICAL: { label: 'Critical Severity', bg: 'bg-[#FFDAD6]', text: 'text-[#93000A]', dot: 'bg-[#BA1A1A]', bar: 'bg-[#BA1A1A]' },
  HIGH: { label: 'High Severity', bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', dot: 'bg-[#EA580C]', bar: 'bg-[#EA580C]' },
  MODERATE: { label: 'Moderate Severity', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', dot: 'bg-[#D97706]', bar: 'bg-[#D97706]' },
  LOW: { label: 'Low Severity', bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', bar: 'bg-[#16A34A]' },
};

function prettyType(type: string): string {
  return type.toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function updatedLabel(minutes: number | null): string {
  if (minutes == null) return 'just now';
  if (minutes < 1) return 'UPDATED JUST NOW';
  if (minutes < 60) return `UPDATED ${minutes}m AGO`;
  return `UPDATED ${Math.floor(minutes / 60)}h AGO`;
}

export const CitizenFloodSheetPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isRestricted, setIsRestricted] = useState(false);
  const [navigatingToRoute, setNavigatingToRoute] = useState(false);
  const [data, setData] = useState<CitizenHazardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchCitizenHazardDetail(id, controller.signal)
      .then((d) => !cancelled && setData(d))
      .catch((err) => {
        if (cancelled || (err as Error)?.name === 'AbortError') return;
        setError(err instanceof ApiError && err.code === 'NOT_FOUND' ? 'This hazard record was not found.' : 'Failed to load hazard details.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

  const handleSafeRoute = () => {
    setNavigatingToRoute(true);
    setTimeout(() => navigate('/citizen/routes'), 400);
  };

  const handleToggleAvoid = () => {
    setIsRestricted(!isRestricted);
  };

  const sev = SEVERITY_META[data?.hazard.severity ?? 'MODERATE'];
  const primaryRoad = data?.corridor.impactedRoads[0] ?? null;

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
                  {data ? `ZONE ${data.zone.code}` : loading ? 'LOADING…' : '—'}
                </span>
              </div>
              <div className="flex items-center gap-space-2xs px-space-xs py-space-2xs rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-secondary">satellite_alt</span>
                <span className="font-code-sm text-code-sm font-semibold text-on-surface">
                  {data?.hazard.dataQuality ?? '—'}
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
              {/* Left Edge Accent Bar (severity color) */}
              <div className={`absolute left-0 top-3 bottom-2 w-1.5 ${sev.bar} rounded-r`}></div>

              {/* Loading / Error states */}
              {loading && (
                <div className="pl-space-xs py-space-sm flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span className="font-body-sm text-body-sm">Loading hazard details…</span>
                </div>
              )}
              {error && !loading && (
                <div role="alert" className="pl-space-xs py-space-sm flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span className="font-body-sm text-body-sm">{error}</span>
                </div>
              )}

              {data && (
              <>
              {/* Pill Badges & Risk Score Row */}
              <div className="flex items-center justify-between gap-space-xs pl-space-xs">
                <div className="flex items-center gap-space-xs flex-wrap">
                  {/* Severity Pill Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`}></span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                      {sev.label}
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
                    <span className="font-label-sm text-label-sm font-semibold">{prettyType(data.hazard.type)}</span>
                  </div>
                </div>

                {/* Risk Score Tabular Metric */}
                <div className="flex items-baseline gap-0.5 shrink-0 bg-surface-container-low px-space-xs py-1 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">RISK</span>
                  <span className="font-data-metric-md text-data-metric-md text-[#EA580C] tracking-tight ml-1 font-bold">
                    {data.risk.score}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">/100</span>
                </div>
              </div>

              {/* Corridor Name & Timestamp */}
              <div className="mt-space-xs pl-space-xs flex items-center justify-between">
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                  {data.corridor.name}
                </h2>
                <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
                  {updatedLabel(data.hazard.freshnessMinutes)}
                </span>
              </div>

              {/* Cause Summary Line (from the deterministic risk engine) */}
              <div className="mt-space-2xs pl-space-xs flex items-start gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#EA580C] shrink-0 mt-0.5">warning</span>
                <p className="font-body-md text-body-md leading-snug">
                  {data.contributingFactors[0] ?? `${prettyType(data.hazard.type)} conditions reported in ${data.zone.name}.`}
                </p>
              </div>
              </>
              )}
            </div>

            {data && (
            <>
            {/* Impact Metrics Cards Row */}
            <div className="px-space-md py-space-xs grid grid-cols-3 gap-space-xs">
              {/* Metric 1: Nearest Road Status */}
              <div className="bg-surface-container-low rounded-xl p-space-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm font-bold">ROAD STATUS</span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
                </div>
                <div className="mt-space-xs">
                  <span className="font-label-md text-label-md text-on-surface font-bold leading-tight line-clamp-2">
                    {primaryRoad ? prettyType(primaryRoad.operationalStatus) : 'No closures'}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-error mt-0.5 font-semibold truncate">
                  {primaryRoad?.name ?? 'No impacted roads nearby'}
                </span>
              </div>

              {/* Metric 2: Water Depth (real measurement, may be null) */}
              <div className="bg-surface-container-low rounded-xl p-space-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm font-bold">WATER DEPTH</span>
                  <span className="material-symbols-outlined text-[16px] text-[#06B6D4]">waves</span>
                </div>
                <div className="mt-space-xs">
                  <span className="font-data-metric-md text-data-metric-md text-on-surface font-bold">
                    {data.hazard.waterDepth != null ? data.hazard.waterDepth : '—'}
                  </span>
                  {data.hazard.waterDepth != null && (
                    <span className="font-body-sm text-body-sm text-on-surface-variant ml-0.5">m</span>
                  )}
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 font-semibold truncate">
                  {data.hazard.source}
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
                    {data.nearestCriticalFacility ? prettyType(data.nearestCriticalFacility.type) : 'None nearby'}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
                  {data.nearestCriticalFacility?.name ?? '—'}
                </span>
              </div>
            </div>

            {/* Live Evacuation & Relief Post Status Strip */}
            {data.nearestCriticalFacility && (
            <div className="px-space-md py-space-xs">
              <div className="bg-surface-container rounded-lg p-space-xs flex items-center justify-between">
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">shield</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm font-bold text-on-surface truncate">
                      {data.nearestCriticalFacility.name}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {prettyType(data.nearestCriticalFacility.operationalStatus)} · {prettyType(data.nearestCriticalFacility.impactType)}
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
            )}
            </>
            )}

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
                {navigatingToRoute ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Opening Safe Routes…</span>
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
