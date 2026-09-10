import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { StickyActionBar } from '../../components/stitch/StickyActionBar';
import { resolveCoords, type GeoState } from '../../citizen/geo';
import { reverseGeocode } from '../../citizen/reverseGeocode';
import { fetchCitizenNearby } from '../../citizen/api';
import { fetchOsrmAlternatives } from '../../citizen/osrm';
import { scoreRoutes, type ScoredRoute } from '../../citizen/api';

const ROUTE_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const MAX_SCORING_POINTS = 60; // stays under the backend's 300-point cap with margin

/** Evenly-strided sample so long OSRM geometries stay small without biasing toward one end. */
function samplePoints<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const stride = points.length / max;
  return Array.from({ length: max }, (_, i) => points[Math.floor(i * stride)]);
}

function riskStyle(level: ScoredRoute['riskLevel']) {
  if (level === 'LOW') return { badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#15803D]', dot: 'bg-[#16A34A]', metric: 'text-on-surface', label: 'LOW RISK' };
  if (level === 'MODERATE') return { badgeBg: 'bg-[#FEF3C7]', badgeText: 'text-[#B45309]', dot: 'bg-[#D97706]', metric: 'text-on-surface', label: 'MODERATE RISK' };
  if (level === 'HIGH') return { badgeBg: 'bg-[#FFEDD5]', badgeText: 'text-[#C2410C]', dot: 'bg-[#EA580C]', metric: 'text-[#C2410C]', label: 'HIGH RISK' };
  return { badgeBg: 'bg-[#FEE2E2]', badgeText: 'text-[#B91C1C]', dot: 'bg-[#DC2626]', metric: 'text-[#B91C1C]', label: 'CRITICAL RISK' };
}

function fmtDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const min = Math.round(seconds / 60);
  return `${min} min`;
}

function fmtDistance(meters: number | null): string {
  if (meters == null) return '—';
  return `${(meters / 1000).toFixed(1)} km`;
}

export const CitizenRouteSelectPage: React.FC = () => {
  const navigate = useNavigate();
  useParams<{ incidentId: string }>();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [whyOpen, setWhyOpen] = useState(true);

  const [origin, setOrigin] = useState<GeoState | null>(null);
  const [originAddress, setOriginAddress] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [routes, setRoutes] = useState<ScoredRoute[] | null>(null);
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
        setOrigin(geo);
        reverseGeocode(geo.latitude, geo.longitude, controller.signal).then((a) => !cancelled && setOriginAddress(a));

        // Real destination: nearest hospital/clinic from our own DB (Chunk 2's nearby endpoint).
        const nearby = await fetchCitizenNearby({ latitude: geo.latitude, longitude: geo.longitude, radiusKm: 20, limit: 40, signal: controller.signal });
        const nearestMedical = nearby.infrastructure.find((i) => i.type === 'HOSPITAL' || i.type === 'CLINIC');
        if (!nearestMedical) throw new Error('No medical facility found nearby to route to.');
        const dest = { name: nearestMedical.name, latitude: nearestMedical.latitude, longitude: nearestMedical.longitude };
        if (cancelled) return;
        setDestination(dest);

        // Real alternative routes from OSRM (free, no key), then risk-scored by our own backend/DB.
        const osrmRoutes = await fetchOsrmAlternatives(geo, dest, controller.signal);
        if (cancelled) return;
        const candidates = osrmRoutes.slice(0, 3).map((r, i) => ({
          label: `Route ${ROUTE_LETTERS[i]} to ${dest.name}`,
          distanceMeters: r.distanceMeters,
          durationSeconds: r.durationSeconds,
          points: samplePoints(r.points, MAX_SCORING_POINTS),
        }));
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
  }, []);

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
                {/* Origin */}
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-secondary"></span>
                  <div className="min-w-0">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block leading-none">
                      Origin
                    </span>
                    <span className="font-title-lg text-title-lg text-on-surface truncate block font-bold">
                      {loading && !origin ? 'Locating…' : originAddress ?? (origin ? `${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}` : 'Unknown')}
                    </span>
                  </div>
                </div>

                <div className="ml-1 w-0.5 h-2 bg-surface-container-highest"></div>

                {/* Destination */}
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-error"></span>
                  <div className="min-w-0">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block leading-none">
                      Destination (nearest medical facility)
                    </span>
                    <span className="font-title-lg text-title-lg text-on-surface truncate block font-bold">
                      {destination?.name ?? (loading ? 'Finding nearest facility…' : '—')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Map Simulation Graphic View (decorative backdrop; route data below is real) */}
          <section className="relative w-full px-edge-margin-mobile mb-space-sm">
            <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] bg-surface-container-low flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container"></div>
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 relative">alt_route</span>

              {/* Live Routing Badge */}
              <div className="absolute top-space-xs right-space-xs flex flex-col gap-1.5 pointer-events-auto">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur shadow-sm text-on-surface font-label-sm text-label-sm font-bold">
                  <span className={`w-2 h-2 rounded-full ${loading ? 'bg-secondary animate-pulse' : 'bg-green-600'}`}></span>
                  {loading ? 'Computing Routes…' : 'OSRM Live Routing'}
                </span>
              </div>

              {/* Summary readout */}
              <div className="absolute bottom-space-xs left-space-xs bg-surface-container-lowest/95 backdrop-blur px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  {routes ? `${routes.length} route${routes.length === 1 ? '' : 's'} compared` : '—'}
                </span>
              </div>
            </div>
          </section>

          {/* Error banner */}
          {error && !loading && (
            <div className="px-edge-margin-mobile mb-space-sm">
              <div role="alert" className="rounded-xl bg-error-container/60 text-on-error-container px-space-sm py-space-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span className="font-body-sm text-body-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="px-edge-margin-mobile flex flex-col items-center justify-center py-10 text-center text-on-surface-variant gap-2">
              <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
              <p className="font-body-sm text-body-sm">Finding your location, nearest facility, and safest route…</p>
            </div>
          )}

          {/* Computed Corridors Carousel */}
          {!loading && routes && routes.length > 0 && (
          <section className="flex flex-col gap-space-xs">
            <div className="px-edge-margin-mobile flex items-center justify-between">
              <div className="flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[18px] text-secondary">alt_route</span>
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-bold">
                  Computed Corridors ({routes.length})
                </span>
              </div>
            </div>

            <div
              className="flex gap-space-sm overflow-x-auto px-edge-margin-mobile no-scrollbar snap-x snap-mandatory pt-1 pb-2"
              id="route-carousel"
            >
              {routes.map((route, i) => {
                const style = riskStyle(route.riskLevel);
                const isRecommended = i === recommendedIndex;
                const warnings = [...route.hazardZonesHit.map((h) => `${h.zoneName} (${h.severity})`), ...route.blockedRoadsHit.map((r) => r.name)];
                return (
                  <div
                    key={route.label + i}
                    className={`route-card snap-start shrink-0 w-[86vw] max-w-[340px] bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] relative cursor-pointer transition-all duration-200 ${
                      selectedIndex === i ? 'ring-2 ring-primary' : 'opacity-90 hover:opacity-100'
                    }`}
                    data-route={ROUTE_LETTERS[i]}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <div className="flex items-center justify-between gap-space-xs mb-space-xs">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full ${style.badgeBg} ${style.badgeText} font-label-sm text-label-sm font-bold`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                        {isRecommended ? `RECOMMENDED • ${style.label}` : style.label}
                      </span>
                      <span className="font-label-sm text-label-sm font-bold bg-surface-container-low px-2 py-0.5 rounded">
                        {warnings.length} hazard{warnings.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <h2 className="font-title-lg text-title-lg text-on-surface font-bold mb-1">{route.label}</h2>
                    <div className="flex items-baseline gap-space-xs mb-space-sm">
                      <span className={`font-data-metric-md text-data-metric-md font-bold ${style.metric}`}>
                        {fmtDuration(route.durationSeconds)}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface-variant">{fmtDistance(route.distanceMeters)}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant ml-auto bg-surface-container-high px-2 py-0.5 rounded font-bold">
                        Risk {route.riskScore}/100
                      </span>
                    </div>

                    {/* Explanation / why this route is (or isn't) resilient */}
                    <div className="bg-surface-container-low rounded-lg p-space-xs">
                      <button
                        className="w-full flex items-center justify-between text-left font-label-sm text-label-sm font-bold text-on-surface"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWhyOpen(!whyOpen);
                        }}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[16px] ${warnings.length === 0 ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                            {warnings.length === 0 ? 'verified_user' : 'warning'}
                          </span>
                          {warnings.length === 0 ? 'Why this route is clear' : 'Hazards along this route'}
                        </span>
                        <span
                          className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform ${whyOpen ? 'rotate-180' : ''}`}
                        >
                          expand_more
                        </span>
                      </button>
                      {whyOpen && (
                        <div className="mt-2.5 pt-2 border-t border-surface-container-highest">
                          <p className="font-body-sm text-body-sm text-on-surface">{route.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )}

          {/* Sticky Bottom Action Bar */}
          <StickyActionBar>
            <div className="w-full pb-3 pt-1">
              <button
                className="w-full h-11 rounded-lg bg-[#0F172A] text-[#FFFFFF] font-body-md text-body-md font-semibold flex items-center justify-center gap-2 hover:bg-[#1E293B] active:scale-[0.99] transition-all shadow-md disabled:opacity-60"
                disabled={loading || !routes?.length}
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
