import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { Mock } from '../../components/stitch/Mock';

export const CitizenActiveNavPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRerouteVisible, setIsRerouteVisible] = useState(true);
  const [isElevationMeshActive, setIsElevationMeshActive] = useState(false);

  const handleEndRoute = () => {
    navigate('/citizen/map');
  };

  const handleReportHazard = () => {
    navigate('/citizen/report');
  };

  const handleViewAlternatives = () => {
    navigate('/citizen/routes');
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header with Back Button and Profile Mark */}
      <Header
        title="Nav Active"
        subtitle="ClimateShield Citizen"
        hasBack={true}
        onBack={() => navigate('/citizen/routes')}
        rightElement={
          <div className="flex items-center gap-space-xs shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
              <Mock label="Route Mode">Safe Corridors</Mock>
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        }
      />

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full relative select-none">
          {/* Map Canvas Simulation Area */}
          <div className="relative w-full h-[540px] bg-surface-container overflow-hidden">
            {/* GIS Topography Background Texture & Gradient */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              data-location="Skyline Parkway, Oakland Hills, CA"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAk4u3Nb8pno6o6xt0eRtwq4L5Hf3wTZ6tG-v7CUasxEDLOFVfobnQ604Zhqw0HczAN5Oeug9uug8eUrRmHWdk0mDIWPrtEFxfBTq7AYZQaygdxrPOHSpub1GURZ6AlNWipIr5buNJDz-LlCyvf8-frm-DG-slUAcykY8N4QK03IbXN7NzqiljCLYQg7Uc44X9gtN6tdAUrVFbuU0ZoRmX9r6VfXfWy8rWunG6iPQtVlFyrew8qn2dg')`,
              }}
            ></div>

            {/* Cartographic Dimming Overlay */}
            <div className="absolute inset-0 bg-primary-container/20 pointer-events-none"></div>

            {/* Active Route Vector Overlay with Pulsing Directional Chevrons */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 400 540"
            >
              {/* Original Hazard Path (Strikethrough / Subdued Alert) */}
              <path
                d="M 200 450 L 200 300 L 280 220"
                opacity="0.65"
                stroke="#DC2626"
                strokeDasharray="6 6"
                strokeLinecap="round"
                strokeWidth="4"
              />

              {/* Safe Rerouted Active Path */}
              <path
                className="drop-shadow-md"
                d="M 200 450 L 200 310 L 150 240 L 150 130 L 220 70"
                stroke="#0051d5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="8"
              />
              <path
                d="M 200 450 L 200 310 L 150 240 L 150 130 L 220 70"
                opacity="0.85"
                stroke="#fefcff"
                strokeDasharray="8 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <animate attributeName="stroke-dashoffset" dur="1.2s" repeatCount="indefinite" values="40;0" />
              </path>

              {/* Citizen Vehicle Pulse Origin */}
              <circle cx="200" cy="440" fill="#316bf3" fillOpacity="0.25" r="18">
                <animate attributeName="r" dur="2s" repeatCount="indefinite" values="12;26;12" />
                <animate attributeName="fill-opacity" dur="2s" repeatCount="indefinite" values="0.4;0.05;0.4" />
              </circle>
              <circle cx="200" cy="440" fill="#0051d5" r="8" stroke="#ffffff" strokeWidth="2" />

              {/* Hazard Pin Marker on discarded route */}
              <g transform="translate(268, 208)">
                <circle cx="12" cy="12" fill="#ba1a1a" fillOpacity="0.2" r="12" />
                <circle cx="12" cy="12" fill="#ba1a1a" r="7" />
              </g>
            </svg>

            {/* Top Left Elevation / Telemetry Pill Badge */}
            <div className="absolute top-space-xs left-edge-margin-mobile z-20">
              <div className="inline-flex items-center gap-space-2xs px-space-xs py-1 rounded-full bg-surface-container-lowest/95 shadow-md backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping"></span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A] -ml-space-2xs"></span>
                <span className="font-label-sm text-label-sm text-[#15803D] uppercase tracking-wide font-bold">
                  Low Risk Corridor
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  <Mock label="Corridor Elevation">Safe MSL +18m</Mock>
                </span>
              </div>
            </div>

            {/* Top Right Compass and Layer Action Control */}
            <div className="absolute top-space-xs right-edge-margin-mobile z-20 flex flex-col gap-space-2xs">
              <button
                aria-label="Recenter map"
                className="w-10 h-10 rounded-lg bg-surface-container-lowest shadow-md flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">explore</span>
              </button>
              <button
                aria-label="Toggle Elevation Mesh"
                className={`w-10 h-10 rounded-lg bg-surface-container-lowest shadow-md flex items-center justify-center transition-colors active:scale-95 ${
                  isElevationMeshActive ? 'text-secondary ring-2 ring-secondary/40' : 'text-on-surface hover:bg-surface-container'
                }`}
                onClick={() => setIsElevationMeshActive(!isElevationMeshActive)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">layers</span>
              </button>
            </div>

            {/* Floating HUD Stack (Maneuver + Dynamic Reroute Alert) */}
            <div className="absolute top-12 left-edge-margin-mobile right-edge-margin-mobile z-30 flex flex-col gap-space-xs pointer-events-none">
              {/* Primary Next Maneuver Panel */}
              <div className="w-full bg-primary-container text-on-primary rounded-xl p-space-md shadow-xl flex items-start justify-between pointer-events-auto">
                <div className="flex items-start gap-space-sm min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-on-secondary shadow-sm">
                    <span className="material-symbols-outlined text-[30px]">turn_right</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-2xs text-secondary-fixed">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                        <Mock label="Maneuver Distance">In 450 meters</Mock>
                      </span>
                      <span className="text-on-primary-container">•</span>
                      <span className="font-label-sm text-label-sm">Lane 2 or 3</span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-on-primary truncate tracking-tight">
                      <Mock label="Next Maneuver">Turn right on Skyline Pkwy</Mock>
                    </h2>
                    {/* Micro Lane Guidance Representation */}
                    <div className="flex items-center gap-1.5 mt-space-2xs">
                      <span className="material-symbols-outlined text-[16px] text-on-primary-container opacity-40">straight</span>
                      <span className="material-symbols-outlined text-[16px] text-on-primary-container opacity-40">straight</span>
                      <span className="material-symbols-outlined text-[18px] text-tertiary-fixed font-bold">turn_right</span>
                      <span className="material-symbols-outlined text-[18px] text-tertiary-fixed font-bold">turn_right</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end pl-space-2xs">
                  <span className="font-data-metric-md text-data-metric-md text-tertiary-fixed">
                    450<span className="font-label-sm text-label-sm ml-0.5">m</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-on-primary-container">Next 1.2km</span>
                </div>
              </div>

              {/* Dynamic Live Rerouting Toast Notification */}
              {isRerouteVisible && (
                <div className="w-full bg-surface-container-lowest text-on-surface rounded-xl p-space-sm shadow-xl flex items-start gap-space-xs transition-all duration-300 pointer-events-auto border border-error/20">
                  <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-error uppercase font-bold tracking-wider">
                        Dynamic Re-Route
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        +2 min delta
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface mt-0.5 leading-snug">
                      Flood risk detected 800m ahead on original path. Auto-adjusted via Highline Ridge.
                    </p>
                    <div className="flex items-center gap-space-sm mt-space-xs">
                      <button
                        className="font-label-sm text-label-sm text-secondary font-bold hover:underline"
                        onClick={() => setIsRerouteVisible(false)}
                        type="button"
                      >
                        Accept Optimal
                      </button>
                      <button
                        className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface"
                        onClick={() => setIsRerouteVisible(false)}
                        type="button"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <button
                    aria-label="Close notification"
                    className="text-on-surface-variant hover:text-on-surface shrink-0 p-1"
                    onClick={() => setIsRerouteVisible(false)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Emergency Incident Reporting FAB Button */}
            <div className="absolute bottom-6 right-edge-margin-mobile z-20">
              <button
                aria-label="Quick Report Hazard"
                className="w-14 h-14 rounded-full bg-error text-on-error shadow-xl flex items-center justify-center hover:opacity-95 active:scale-95 transition-all"
                onClick={handleReportHazard}
                type="button"
              >
                <span className="material-symbols-outlined text-[28px]">report_problem</span>
              </button>
            </div>

            {/* Live Telemetry / Satellite Fix Float Tag */}
            <div className="absolute bottom-6 left-edge-margin-mobile z-20">
              <div className="flex items-center gap-space-2xs px-space-xs py-1 rounded-lg bg-surface-container-lowest/90 backdrop-blur-sm shadow-sm">
                <span className="material-symbols-outlined text-[15px] text-secondary">satellite_alt</span>
                <span className="font-label-sm text-label-sm text-on-surface font-mono">
                  <Mock label="RTK Precision">RTK FIX: 0.04m</Mock>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Docked Navigation Operational Summary Sheet */}
          <div className="w-full bg-surface-container-lowest shadow-[0_-6px_24px_rgba(15,23,42,0.06)] rounded-t-xl px-edge-margin-mobile pt-space-md pb-space-lg flex flex-col gap-space-md z-40">
            {/* Top Drag Indicator & Overview Stats Line */}
            <div className="w-full flex flex-col items-center">
              <div className="w-10 h-1 rounded-full bg-surface-variant mb-space-xs"></div>
              {/* Metrics Bento Grid */}
              <div className="w-full grid grid-cols-3 gap-space-xs text-center py-space-2xs">
                <div className="flex flex-col items-center justify-center p-space-xs rounded-lg bg-surface-container-low">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Remaining</span>
                  <span className="font-data-metric-lg text-data-metric-lg text-secondary font-bold tracking-tight mt-0.5">
                    18
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant -mt-1 font-semibold">MINUTES</span>
                </div>
                <div className="flex flex-col items-center justify-center p-space-xs rounded-lg bg-surface-container-low">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Distance</span>
                  <span className="font-data-metric-lg text-data-metric-lg text-on-surface font-bold tracking-tight mt-0.5">
                    6.2
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant -mt-1 font-semibold">KILOMETERS</span>
                </div>
                <div className="flex flex-col items-center justify-center p-space-xs rounded-lg bg-surface-container-low">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">ETA</span>
                  <span className="font-data-metric-lg text-data-metric-lg text-on-surface font-bold tracking-tight mt-0.5">
                    14:42
                  </span>
                  <span className="font-label-sm text-label-sm text-[#15803D] -mt-1 font-bold">ON TIME</span>
                </div>
              </div>
            </div>

            {/* Active Route Details & Alternative Trigger */}
            <div className="flex items-center justify-between px-space-2xs">
              <div className="flex items-center gap-space-xs min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  <Mock label="Route Destination">To: Station 14 High-Ground Refuge</Mock>
                </span>
              </div>
              <button
                className="font-label-sm text-label-sm text-secondary hover:text-on-secondary-fixed-variant font-bold uppercase tracking-wider shrink-0 transition-colors"
                onClick={handleViewAlternatives}
                type="button"
              >
                View Alternatives
              </button>
            </div>

            {/* Single Primary Operational Action Area */}
            <div className="w-full flex items-center gap-space-sm pt-space-2xs">
              <button
                className="flex-1 h-11 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-lg text-title-lg font-bold flex items-center justify-center gap-space-2xs transition-colors active:scale-95"
                onClick={handleReportHazard}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">add_alert</span>
                <span>Report Hazard</span>
              </button>
              <button
                className="flex-1 h-11 rounded-lg bg-primary hover:bg-inverse-surface text-on-primary font-title-lg text-title-lg font-bold flex items-center justify-center gap-space-2xs transition-colors shadow-sm active:scale-95"
                onClick={handleEndRoute}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                <span>End Route</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CitizenActiveNavPage;
