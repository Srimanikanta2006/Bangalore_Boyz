import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { StickyActionBar } from '../../components/stitch/StickyActionBar';
import { Mock } from '../../components/stitch/Mock';

type RouteId = 'A' | 'B' | 'C';

export const CitizenRouteSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidentId } = useParams<{ incidentId: string }>();

  const [selectedRoute, setSelectedRoute] = useState<RouteId>('A');
  const [whyOpen, setWhyOpen] = useState(true);
  const [isEndpointsSwapped, setIsEndpointsSwapped] = useState(false);

  const handleStartNav = () => {
    navigate('/citizen/navigate');
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header with Back Button */}
      <Header
        title="Route Select"
        subtitle="ClimateShield Citizen"
        hasBack={true}
        onBack={() => navigate('/citizen/map')}
      />

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full pb-28">
          {/* Origin / Destination Endpoint Card */}
          <section className="px-edge-margin-mobile pt-space-xs pb-space-sm flex flex-col gap-space-xs">
            <div className="bg-surface-container-lowest rounded-xl p-space-xs shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] flex items-center justify-between gap-space-xs">
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                {/* Endpoint 1 */}
                <div className="flex items-center gap-space-xs min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isEndpointsSwapped ? 'bg-error' : 'bg-secondary'
                    }`}
                  ></span>
                  <div className="min-w-0">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block leading-none">
                      {isEndpointsSwapped ? 'Destination' : 'Origin'}
                    </span>
                    <span className="font-title-lg text-title-lg text-on-surface truncate block font-bold">
                      {isEndpointsSwapped ? 'North General Medical Center' : 'Current Location'}
                    </span>
                  </div>
                </div>

                <div className="ml-1 w-0.5 h-2 bg-surface-container-highest"></div>

                {/* Endpoint 2 */}
                <div className="flex items-center gap-space-xs min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isEndpointsSwapped ? 'bg-secondary' : 'bg-error'
                    }`}
                  ></span>
                  <div className="min-w-0">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block leading-none">
                      {isEndpointsSwapped ? 'Origin' : 'Destination'}
                    </span>
                    <span className="font-title-lg text-title-lg text-on-surface truncate block font-bold">
                      {isEndpointsSwapped ? 'Current Location' : 'North General Medical Center'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <button
                aria-label="Swap endpoints"
                className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container transition-all active:scale-95 shrink-0"
                id="swap-route-btn"
                type="button"
                onClick={() => setIsEndpointsSwapped(!isEndpointsSwapped)}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${
                    isEndpointsSwapped ? 'rotate-180' : ''
                  }`}
                >
                  swap_vert
                </span>
              </button>
            </div>
          </section>

          {/* Map Simulation Graphic View */}
          <section className="relative w-full px-edge-margin-mobile mb-space-sm">
            <div className="relative w-full h-72 rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] bg-surface-container-low">
              <div
                className="absolute inset-0 bg-cover bg-center"
                data-location="North General Medical Center, Seattle, WA"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBozV8_84xgwSOE9bpJeRkP6Kr1FrQxgmc_MzlokfkJ1fWorkEKrRApHzEnszZVr5bNUB7eWuOW23UCxnvjoW6XtD9LF6mSaFboqi7LruF4g5vb9Jxa4IK8fnVchAVEL8KKGjFvGqWmkQxze8Ta-8B_pD3nILBR2p2kRGOlI4YToNdE_387yRAQ3ionVhliT_qEuouwFUhyZ4DMPc634mHamVpWUUoD3ZeNkHuR8LPNZhBwaiP_Zzpv')`,
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/40 via-transparent to-surface-container-lowest/80 pointer-events-none"></div>

              {/* SVG Corridors */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 360 288">
                {/* Route C Path */}
                <path
                  d="M 45 235 C 110 240, 160 210, 210 160 C 240 130, 275 110, 315 55"
                  id="route-c-path"
                  stroke="#ba1a1a"
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={selectedRoute === 'C' ? 1 : 0.65}
                  strokeWidth={selectedRoute === 'C' ? 6 : 3}
                />
                {/* Route B Path */}
                <path
                  d="M 45 235 C 90 200, 120 180, 175 145 C 220 115, 260 85, 315 55"
                  id="route-b-path"
                  stroke="#d97706"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={selectedRoute === 'B' ? 1 : 0.8}
                  strokeWidth={selectedRoute === 'B' ? 6 : 3}
                />
                {/* Route A Path */}
                <path
                  className="route-glow"
                  d="M 45 235 C 70 160, 110 100, 160 85 C 215 70, 265 65, 315 55"
                  id="route-a-path"
                  stroke="#16a34a"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={selectedRoute === 'A' ? 6 : 3}
                />

                {/* Origin Marker */}
                <circle cx="45" cy="235" fill="#0051d5" r="7" />
                <circle className="animate-ping" cx="45" cy="235" fill="#0051d5" fillOpacity="0.2" r="14" />

                {/* Destination Cross Marker */}
                <g transform="translate(305, 37)">
                  <rect fill="#ba1a1a" height="26" rx="6" width="26" />
                  <path d="M13 7 V19 M7 13 H19" stroke="#ffffff" strokeLinecap="round" strokeWidth="2.5" />
                </g>

                {/* Hazard Pin C */}
                <g transform="translate(195, 140)">
                  <circle cx="10" cy="10" fill="#fee2e2" r="10" />
                  <path d="M10 5 L16 15 H4 Z" fill="#ba1a1a" />
                </g>

                {/* Hazard Pin B */}
                <g transform="translate(145, 150)">
                  <circle cx="9" cy="9" fill="#fef3c7" r="9" />
                  <text fill="#b45309" fontSize="10" fontWeight="bold" textAnchor="middle" x="9" y="13">
                    !
                  </text>
                </g>
              </svg>

              {/* Live Elevation Sync Badge */}
              <div className="absolute top-space-xs right-space-xs flex flex-col gap-1.5 pointer-events-auto">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur shadow-sm text-on-surface font-label-sm text-label-sm font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                  Live Elevation Sync
                </span>
              </div>

              {/* Gradient readout */}
              <div className="absolute bottom-space-xs left-space-xs bg-surface-container-lowest/95 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Safe Corridor Gradient:
                </span>
                <span className="font-code-sm text-code-sm font-bold text-on-surface">
                  <Mock label="Corridor MSL">+18.2m MSL</Mock>
                </span>
              </div>
            </div>
          </section>

          {/* Computed Corridors Carousel */}
          <section className="flex flex-col gap-space-xs">
            <div className="px-edge-margin-mobile flex items-center justify-between">
              <div className="flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[18px] text-secondary">alt_route</span>
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-bold">
                  Computed Corridors (3)
                </span>
              </div>
              <span className="font-code-sm text-code-sm text-on-surface-variant">Updated 12s ago</span>
            </div>

            <div
              className="flex gap-space-sm overflow-x-auto px-edge-margin-mobile no-scrollbar snap-x snap-mandatory pt-1 pb-2"
              id="route-carousel"
            >
              {/* Route A Card */}
              <div
                className={`route-card snap-start shrink-0 w-[86vw] max-w-[340px] bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] relative cursor-pointer transition-all duration-200 ${
                  selectedRoute === 'A' ? 'ring-2 ring-primary' : 'opacity-90 hover:opacity-100'
                }`}
                data-route="A"
                onClick={() => setSelectedRoute('A')}
              >
                <div className="flex items-center justify-between gap-space-xs mb-space-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-[#DCFCE7] text-[#15803D] font-label-sm text-label-sm font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                    RECOMMENDED • LOW RISK
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-[#15803D] bg-surface-container-low px-2 py-0.5 rounded">
                    0 Hazards
                  </span>
                </div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold mb-1">
                  <Mock label="Route A Title">Route A via Highline Ridge</Mock>
                </h2>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <span className="font-data-metric-md text-data-metric-md text-on-surface font-bold">
                    <Mock label="ETA">18 min</Mock>
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">8.4 km</span>
                  <span className="font-label-sm text-label-sm text-secondary ml-auto bg-surface-container-high px-2 py-0.5 rounded font-bold">
                    +14m Peak Elevation
                  </span>
                </div>

                {/* Collapsible Accordion: Why this route is resilient */}
                <div className="bg-surface-container-low rounded-lg p-space-xs mb-space-xs">
                  <button
                    className="w-full flex items-center justify-between text-left font-label-sm text-label-sm font-bold text-on-surface"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWhyOpen(!whyOpen);
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#16A34A]">verified_user</span>
                      Why this route is resilient
                    </span>
                    <span
                      className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform ${
                        whyOpen ? 'rotate-180' : ''
                      }`}
                      id="breakdown-chevron"
                    >
                      expand_more
                    </span>
                  </button>
                  {whyOpen && (
                    <div
                      className="mt-2.5 flex flex-col gap-1.5 pt-2 border-t border-surface-container-highest"
                      id="breakdown-content"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-[#16A34A] shrink-0">check_circle</span>
                        <span className="font-body-sm text-body-sm text-on-surface">
                          Elevated topography (+14m safety zone)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-[#16A34A] shrink-0">check_circle</span>
                        <span className="font-body-sm text-body-sm text-on-surface">
                          100% storm drain clear &amp; functional
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-[#16A34A] shrink-0">check_circle</span>
                        <span className="font-body-sm text-body-sm text-on-surface">
                          Bypasses Waterfront inundation zone
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Route B Card */}
              <div
                className={`route-card snap-start shrink-0 w-[86vw] max-w-[340px] bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] relative cursor-pointer transition-all duration-200 ${
                  selectedRoute === 'B' ? 'ring-2 ring-primary' : 'opacity-90 hover:opacity-100'
                }`}
                data-route="B"
                onClick={() => setSelectedRoute('B')}
              >
                <div className="flex items-center justify-between gap-space-xs mb-space-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-[#FEF3C7] text-[#B45309] font-label-sm text-label-sm font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                    MODERATE RISK
                  </span>
                  <span className="font-label-sm text-label-sm text-error bg-error-container px-2 py-0.5 rounded font-bold">
                    1 Hazard
                  </span>
                </div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold mb-1">
                  <Mock label="Route B Title">Route B via Central Ave</Mock>
                </h2>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <span className="font-data-metric-md text-data-metric-md text-on-surface font-bold">14 min</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">6.1 km</span>
                  <span className="font-label-sm text-label-sm text-[#B45309] ml-auto font-bold">Faster (-4m)</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#D97706] shrink-0 mt-0.5">warning</span>
                  <div className="min-w-0">
                    <span className="font-label-sm text-label-sm font-bold text-on-surface block">
                      1 Minor Road Block
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">
                      Single lane diversion active near 4th St due to fallen utility pole.
                    </span>
                  </div>
                </div>
              </div>

              {/* Route C Card */}
              <div
                className={`route-card snap-start shrink-0 w-[86vw] max-w-[340px] bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] relative cursor-pointer transition-all duration-200 ${
                  selectedRoute === 'C' ? 'ring-2 ring-primary' : 'opacity-90 hover:opacity-100'
                }`}
                data-route="C"
                onClick={() => setSelectedRoute('C')}
              >
                <div className="flex items-center justify-between gap-space-xs mb-space-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-label-sm text-label-sm font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                    HIGH RISK
                  </span>
                  <span className="font-label-sm text-label-sm text-error bg-error-container px-2 py-0.5 rounded font-bold">
                    Critical Alert
                  </span>
                </div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold mb-1">
                  <Mock label="Route C Title">Route C via River Parkway</Mock>
                </h2>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <span className="font-data-metric-md text-data-metric-md text-[#B91C1C] font-bold">26 min</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">9.2 km</span>
                  <span className="font-label-sm text-label-sm text-[#B91C1C] ml-auto font-bold">+8 min Delay</span>
                </div>
                <div className="bg-[#FEE2E2]/60 rounded-lg p-space-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#DC2626] shrink-0 mt-0.5">flood</span>
                  <div className="min-w-0">
                    <span className="font-label-sm text-label-sm font-bold text-[#B91C1C] block">
                      Severe Flash Flood
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">
                      River surge exceeding 35cm. Impassable for light vehicles.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sticky Bottom Action Bar */}
          <StickyActionBar>
            <button
              className="font-label-md text-label-md text-secondary hover:text-on-secondary-fixed-variant font-bold py-1.5 flex items-center gap-1 transition-colors active:scale-95"
              type="button"
              onClick={() => alert('Displaying 4 municipal evacuation checkpoints and water shelters along Highline Ridge.')}
            >
              <span className="material-symbols-outlined text-[16px]">pin_drop</span>
              <span>View Alternate Waypoints</span>
            </button>
            <div className="w-full pb-3 pt-1">
              <button
                className="w-full h-11 rounded-lg bg-[#0F172A] text-[#FFFFFF] font-body-md text-body-md font-semibold flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.99] transition-all shadow-md"
                id="start-nav-btn"
                type="button"
                onClick={handleStartNav}
              >
                <span className="material-symbols-outlined text-[20px]">navigation</span>
                <span>Start Navigation</span>
              </button>
            </div>
          </StickyActionBar>
        </div>
      </main>
    </div>
  );
};
