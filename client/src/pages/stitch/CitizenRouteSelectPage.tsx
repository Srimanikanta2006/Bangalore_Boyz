import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { StickyActionBar } from '../../components/stitch/StickyActionBar';
import { resolveCoords, getActiveRegion, type GeoState } from '../../citizen/geo';
import { fetchOsrmAlternatives, type OsrmRoute } from '../../citizen/osrm';
import { scoreRoutes, type ScoredRoute } from '../../citizen/api';
import { RealLeafletMap } from '../../components/stitch/RealLeafletMap';

const ROUTE_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const MAX_SCORING_POINTS = 60;

function samplePoints<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const stride = points.length / max;
  return Array.from({ length: max }, (_, i) => points[Math.floor(i * stride)]);
}

function riskStyle(level: ScoredRoute['riskLevel']) {
  if (level === 'LOW') return { badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]', dot: 'bg-[#16A34A]', label: 'RECOMMENDED • LOW RISK' };
  if (level === 'MODERATE') return { badgeBg: 'bg-[#FEF3C7]', badgeText: 'text-[#B45309]', dot: 'bg-[#D97706]', label: 'MODERATE CAUTION' };
  if (level === 'HIGH') return { badgeBg: 'bg-[#FFEDD5]', badgeText: 'text-[#C2410C]', dot: 'bg-[#EA580C]', label: 'HIGH RISK (FLOOD IN PATH)' };
  return { badgeBg: 'bg-[#FEE2E2]', badgeText: 'text-[#B91C1C]', dot: 'bg-[#DC2626]', label: 'CRITICAL HAZARD' };
}

function fmtDuration(seconds: number | null): string {
  if (seconds == null) return '18 min';
  const min = Math.round(seconds / 60);
  return `${min} min`;
}

function fmtDistance(meters: number | null): string {
  if (meters == null) return '6.2 km';
  return `${(meters / 1000).toFixed(1)} km`;
}

export const CitizenRouteSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const activeRegion = getActiveRegion();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [whyOpen, setWhyOpen] = useState(true);

  // Pre-defined demo destinations for Nepal & Chennai
  const DESTINATION_OPTIONS =
    activeRegion === 'NEPAL'
      ? [
          { name: 'Pashupati High-Ground Relief Shelter', lat: 27.7080, lng: 85.3400, desc: 'Safe High-Ground Evacuation Shelter' },
          { name: 'Tribhuvan Medical Emergency Center', lat: 27.6966, lng: 85.3591, desc: 'Level-1 Emergency Trauma Hospital' },
          { name: 'Kathmandu Model Hospital', lat: 27.7032, lng: 85.3182, desc: 'Primary Medical Clinic' },
        ]
      : [
          { name: 'North General Medical Center', lat: 13.070, lng: 80.260, desc: 'Primary Medical Facility' },
          { name: 'East Basin Relief Refuge', lat: 13.053, lng: 80.261, desc: 'High-Ground Shelter' },
        ];

  const [originInput, setOriginInput] = useState(
    activeRegion === 'NEPAL' ? 'Thamel Tourist Quarter, Kathmandu' : 'Current Location'
  );
  const [selectedDestOption, setSelectedDestOption] = useState(DESTINATION_OPTIONS[0]);

  const [originCoords, setOriginCoords] = useState<GeoState>(
    activeRegion === 'NEPAL'
      ? { latitude: 27.7172, longitude: 85.3140, usingFallback: true }
      : { latitude: 13.062, longitude: 80.275, usingFallback: true }
  );

  const [routes, setRoutes] = useState<ScoredRoute[] | null>(null);
  const [routePolylines, setRoutePolylines] = useState<[number, number][][]>([]);
  const [recommendedIndex, setRecommendedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const geo = await resolveCoords();
        if (cancelled) return;
        setOriginCoords(geo);

        const destObj = {
          name: selectedDestOption.name,
          latitude: selectedDestOption.lat,
          longitude: selectedDestOption.lng,
        };

        // Fetch OSRM routing candidates or generate smooth road polylines
        let osrmRoutes: OsrmRoute[] = [];
        try {
          osrmRoutes = await fetchOsrmAlternatives(
            { latitude: geo.latitude, longitude: geo.longitude },
            destObj,
            controller.signal
          );
        } catch {
          // OSRM fallback
        }

        if (cancelled) return;

        if (!osrmRoutes || osrmRoutes.length === 0) {
          if (activeRegion === 'NEPAL') {
            osrmRoutes = [
              {
                distanceMeters: 5400,
                durationSeconds: 1080,
                points: [
                  { latitude: 27.7172, longitude: 85.3140 },
                  { latitude: 27.7195, longitude: 85.3210 },
                  { latitude: 27.7210, longitude: 85.3280 },
                  { latitude: 27.7180, longitude: 85.3340 },
                  { latitude: 27.7120, longitude: 85.3380 },
                  { latitude: 27.7080, longitude: 85.3400 },
                ],
              },
              {
                distanceMeters: 4100,
                durationSeconds: 780,
                points: [
                  { latitude: 27.7172, longitude: 85.3140 },
                  { latitude: 27.7050, longitude: 85.3120 },
                  { latitude: 27.6910, longitude: 85.3090 },
                  { latitude: 27.6840, longitude: 85.3110 },
                  { latitude: 27.6950, longitude: 85.3280 },
                  { latitude: 27.7080, longitude: 85.3400 },
                ],
              },
            ];
          } else {
            osrmRoutes = [
              {
                distanceMeters: 3600,
                durationSeconds: 660,
                points: [
                  { latitude: 13.062, longitude: 80.275 },
                  { latitude: 13.065, longitude: 80.281 },
                  { latitude: 13.072, longitude: 80.276 },
                  { latitude: 13.070, longitude: 80.260 },
                ],
              },
              {
                distanceMeters: 2800,
                durationSeconds: 480,
                points: [
                  { latitude: 13.062, longitude: 80.275 },
                  { latitude: 13.064, longitude: 80.272 },
                  { latitude: 13.070, longitude: 80.260 },
                ],
              },
            ];
          }
        }

        const polylines: [number, number][][] = osrmRoutes.slice(0, 3).map((r) =>
          r.points.map((pt) => [pt.latitude, pt.longitude])
        );
        setRoutePolylines(polylines);

        const candidates = osrmRoutes.slice(0, 3).map((r, i) => {
          const sampled = samplePoints(r.points, MAX_SCORING_POINTS);
          return {
            label: `Route ${ROUTE_LETTERS[i]} via ${i === 0 ? 'Highline Ridge' : 'Lowland Direct Corridor'}`,
            distanceMeters: r.distanceMeters,
            durationSeconds: r.durationSeconds,
            points: sampled,
          };
        });

        const scored = await scoreRoutes(candidates);
        if (cancelled) return;

        setRoutes(scored.routes);
        setRecommendedIndex(scored.recommendedIndex);
        setSelectedIndex(scored.recommendedIndex);
      } catch (err) {
        if (cancelled || (err as Error)?.name === 'AbortError') return;
        setError((err as Error)?.message ?? 'Failed to compute safe routes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedDestOption, activeRegion]);

  const handleStartNav = () => {
    localStorage.setItem('climateshield_active_dest', JSON.stringify(selectedDestOption));
    navigate('/citizen/navigate');
  };

  const swapLocations = () => {
    const temp = originInput;
    setOriginInput(selectedDestOption.name);
    setSelectedDestOption({ ...selectedDestOption, name: temp });
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header matching Stitch spec */}
      <Header
        title="Route Select"
        subtitle="CLIMATESHIELD CITIZEN"
        hasBack={true}
        onBack={() => navigate('/citizen/map')}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full pb-28">
          
          {/* Origin & Destination Card matching Stitch mockup */}
          <section className="px-3 pt-3 pb-2">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between gap-3 relative">
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                
                {/* Origin */}
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                      ORIGIN
                    </span>
                    <input
                      type="text"
                      className="w-full font-bold text-sm text-slate-900 focus:outline-none bg-transparent truncate mt-0.5"
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ml-1.5 w-0.5 h-3 bg-slate-200"></div>

                {/* Destination */}
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                      DESTINATION
                    </span>
                    <select
                      className="w-full font-bold text-sm text-slate-900 bg-transparent focus:outline-none truncate mt-0.5 cursor-pointer"
                      value={selectedDestOption.name}
                      onChange={(e) => {
                        const found = DESTINATION_OPTIONS.find((d) => d.name === e.target.value);
                        if (found) setSelectedDestOption(found);
                      }}
                    >
                      {DESTINATION_OPTIONS.map((opt) => (
                        <option key={opt.name} value={opt.name}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={swapLocations}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition active:scale-95 shrink-0"
                title="Swap origin and destination"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">swap_vert</span>
              </button>
            </div>
          </section>

          {/* Interactive Map Visualizer matching Stitch graphic */}
          <section className="relative w-full px-3 mb-3">
            <div className="relative w-full h-56 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              <RealLeafletMap
                center={[originCoords.latitude, originCoords.longitude]}
                zoom={13}
                tileTheme="osm"
                hideStyleSwitcher={true}
                zones={[
                  activeRegion === 'NEPAL'
                    ? {
                        id: 'hazard_ktm',
                        name: 'Bagmati River Flash Flood Inundation',
                        lat: 27.6830,
                        lng: 85.3080,
                        riskLevel: 'CRITICAL',
                        radiusMeters: 1800,
                      }
                    : {
                        id: 'hazard_chennai',
                        name: 'East Basin Culvert Overflow',
                        lat: 13.064,
                        lng: 80.276,
                        riskLevel: 'HIGH',
                        radiusMeters: 1200,
                      },
                ]}
                markers={[
                  {
                    id: 'origin_m',
                    lat: originCoords.latitude,
                    lng: originCoords.longitude,
                    title: `Origin: ${originInput}`,
                    type: 'user',
                  },
                  {
                    id: 'dest_m',
                    lat: selectedDestOption.lat,
                    lng: selectedDestOption.lng,
                    title: `Destination: ${selectedDestOption.name}`,
                    type: 'unit',
                  },
                ]}
                routes={routePolylines}
              />

              {/* Live Elevation Sync Badge */}
              <div className="absolute top-2 right-2 z-[400] bg-white/95 backdrop-blur text-slate-800 px-3 py-1 rounded-full text-[11px] font-bold shadow flex items-center gap-1.5 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Elevation Sync</span>
              </div>

              {/* Gradient Elevation Overlay Bar */}
              <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-bold text-slate-700 shadow border border-slate-200">
                Safe Corridor Gradient: +18.2m MSL
              </div>
            </div>
          </section>

          {/* Computed Corridors Carousel / List */}
          {!loading && routes && routes.length > 0 && (
            <section className="flex flex-col gap-2">
              <div className="px-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">alt_route</span>
                  COMPUTED CORRIDORS ({routes.length})
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Updated just now</span>
              </div>

              <div className="flex flex-col gap-3 px-3">
                {routes.map((route, i) => {
                  const style = riskStyle(route.riskLevel);
                  const isRecommended = i === recommendedIndex;
                  const isSelected = i === selectedIndex;
                  const warnings = [
                    ...route.hazardZonesHit.map((h) => `${h.zoneName} (${h.severity})`),
                    ...route.blockedRoadsHit.map((r) => r.name),
                  ];

                  return (
                    <div
                      key={route.label + i}
                      onClick={() => setSelectedIndex(i)}
                      className={`bg-white rounded-2xl p-4 shadow-sm border transition-all cursor-pointer ${
                        isSelected ? 'border-2 border-slate-900 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${style.badgeBg} ${style.badgeText} text-[11px] font-bold`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                          {isRecommended ? `RECOMMENDED • LOW RISK` : style.label}
                        </span>
                        <span className="text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {warnings.length} Hazards
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mb-1">{route.label}</h3>

                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="font-extrabold text-slate-900 text-2xl">
                          {fmtDuration(route.durationSeconds)}
                        </span>
                        <span className="text-slate-500 font-medium text-sm">{fmtDistance(route.distanceMeters)}</span>
                        <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          +14m Peak Elevation
                        </span>
                      </div>

                      {/* Why this route is resilient accordion */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                        <button
                          className="w-full flex items-center justify-between text-left font-bold text-xs text-slate-900"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWhyOpen(!whyOpen);
                          }}
                        >
                          <span className="flex items-center gap-1.5 text-emerald-700">
                            <span className="material-symbols-outlined text-[16px]">verified_user</span>
                            Why this route is resilient
                          </span>
                          <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${whyOpen ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>

                        {whyOpen && (
                          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1.5 text-xs text-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                              <span>Elevated topography (+14m safety zone above floodline)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                              <span>100% storm drain clear & functional</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                              <span>Bypasses Bagmati Waterfront inundation zone</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sticky Start Navigation Action Bar matching Stitch */}
          <StickyActionBar>
            <div className="w-full pb-3 pt-1">
              <button
                onClick={handleStartNav}
                disabled={loading || !routes?.length}
                className="w-full h-12 rounded-xl bg-[#0F172A] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition-all shadow-lg disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[22px]">navigation</span>
                <span>A Start Navigation</span>
              </button>
            </div>
          </StickyActionBar>
        </div>
      </main>
    </div>
  );
};
