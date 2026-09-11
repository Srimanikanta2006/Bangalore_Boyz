import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { fetchZoneCascade, explainIncident, createTask, fetchLiveWeather, type LiveWeather } from '../../services/api';
import { RealLeafletMap } from '../../components/stitch/RealLeafletMap';
import { getActiveRegion, type RegionKey } from '../../citizen/geo';
import { 
  Waves, AlertTriangle, Hospital, Zap, ArrowRight, 
  Layers, Users, Shield, Radio, CheckCircle2, ChevronRight, Sparkles, Thermometer
} from 'lucide-react';

const POLL_INTERVAL_MS = 15000;
const DEMO_INCIDENT_ID = 'INC-204';

const chainColors = ['#ba1a1a', '#ea580c', '#316bf3', '#0090a9'];

export const GovZoneCascadePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [activeRegion, setActiveRegionState] = useState<RegionKey>(getActiveRegion());
  const [activeLayer, setActiveLayer] = useState<'hydro' | 'arterials' | 'egress'>('hydro');
  const [mitigationDispatched, setMitigationDispatched] = useState(false);

  // Dynamic Region Change Listener
  useEffect(() => {
    const handleRegionEvent = () => setActiveRegionState(getActiveRegion());
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  const isNepal = activeRegion === 'NEPAL';
  const zoneId = id || (isNepal ? 'KTM' : 'EB');

  // Live zone cascade
  const [cascadeData, setCascadeData] = useState<any | null>(null);
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);

  // Grounded AI explanation
  const [explain, setExplain] = useState<any | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // Operator approval state
  const [approved, setApproved] = useState<Record<number, 'pending' | 'done' | 'error'>>({});

  useEffect(() => {
    let active = true;
    const centerCoords = isNepal ? { lat: 27.7172, lng: 85.3140 } : { lat: 13.062, lng: 80.275 };

    const load = async () => {
      try {
        const [cData, wData] = await Promise.all([
          fetchZoneCascade(zoneId).catch(() => null),
          fetchLiveWeather(centerCoords.lat, centerCoords.lng).catch(() => null),
        ]);
        if (active) {
          if (cData) setCascadeData(cData);
          if (wData) setLiveWeather(wData);
        }
      } catch {
        // Fallback
      }
    };
    load();

    handleExplain();

    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [zoneId, activeRegion]);

  const handleExplain = async () => {
    setExplainLoading(true);
    setExplainError(null);
    try {
      const data = await explainIncident(DEMO_INCIDENT_ID);
      setExplain(data);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'AI explanation unavailable');
    } finally {
      setExplainLoading(false);
    }
  };

  const priorityToTask = (p?: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    const up = (p || '').toUpperCase();
    if (up === 'CRITICAL') return 'CRITICAL';
    if (up === 'HIGH') return 'HIGH';
    if (up === 'MEDIUM' || up === 'MODERATE') return 'MEDIUM';
    return 'LOW';
  };

  const handleApprove = async (index: number, action: any) => {
    setApproved((prev) => ({ ...prev, [index]: 'pending' }));
    try {
      await createTask({
        title: action?.reason || action?.actionId || 'Operator-approved response action',
        incidentId: isNepal ? 'INC-KTM-01' : DEMO_INCIDENT_ID,
        priority: priorityToTask(action?.priority),
        description: `Approved from Zone ${zoneId} cascade AI recommendation (${action?.actionId ?? 'n/a'}).`,
      });
      setApproved((prev) => ({ ...prev, [index]: 'done' }));
    } catch {
      setApproved((prev) => ({ ...prev, [index]: 'error' }));
    }
  };

  const handleDispatchMitigation = () => {
    setMitigationDispatched(true);
    setTimeout(() => {
      navigate('/gov/response-center');
    }, 900);
  };

  // Region-Specific Coordinates & Datasets
  const mapCenter: [number, number] = isNepal ? [27.7172, 85.3140] : [13.062, 80.275];

  const mapZones = [
    isNepal
      ? {
          id: 'zone_ktm_nepal',
          name: 'Sector inc_ktm: Kathmandu Bagmati River Inundation Corridor',
          lat: 27.7172,
          lng: 85.3140,
          riskLevel: 'CRITICAL' as const,
          radiusMeters: 2200,
        }
      : {
          id: `zone_${zoneId}`,
          name: `Sector ${zoneId}: Bayou Crossing Corridor`,
          lat: 13.062,
          lng: 80.275,
          riskLevel: (cascadeData?.riskLevel as any) || 'CRITICAL',
          radiusMeters: 1600,
        },
  ];

  const mapMarkers = isNepal
    ? [
        {
          id: 'inc_ktm',
          lat: 27.6830,
          lng: 85.3080,
          title: '#INC-KTM-01 · Bagmati River Flash Flood Breach',
          description: 'Threat: FLOOD_BOAT | Water depth 2.1m | Flow Velocity 2.4 m/s | Risk Score: 94/100',
          severity: 'CRITICAL' as const,
          type: 'incident' as const,
        },
        {
          id: 'asset_brg_ktm',
          lat: 27.6890,
          lng: 85.3190,
          title: 'BRG-KTM · Bagmati Main River Bridge',
          description: 'Status: BRIDGE COMPROMISED (94/100) | Abutment Submersion Ingress',
          severity: 'CRITICAL' as const,
          type: 'asset' as const,
        },
        {
          id: 'asset_hwy_ktm',
          lat: 27.6950,
          lng: 85.3150,
          title: 'HWY-KTM · Balkhu Highway Interchange',
          description: 'Status: INUNDATED (82/100) | Primary Lowland Transit Road Submerged',
          severity: 'HIGH' as const,
          type: 'asset' as const,
        },
        {
          id: 'asset_hosp_ktm',
          lat: 27.6966,
          lng: 85.3591,
          title: 'HOSP-KTM · Tribhuvan Medical Emergency Hub',
          description: 'Status: ACCESS_BLOCKED (76/100) | Gate B Water Ingress +18in',
          severity: 'HIGH' as const,
          type: 'asset' as const,
        },
      ]
    : [
        {
          id: 'inc_204',
          lat: 13.064,
          lng: 80.276,
          title: '#INC-204 · Bayou Culvert Flash Overflow',
          description: 'Threat: FLOOD_BOAT | Water depth 1.4m | Risk Score: 84/100',
          severity: 'CRITICAL' as const,
          type: 'incident' as const,
        },
        {
          id: 'asset_drain_07',
          lat: 13.062,
          lng: 80.273,
          title: 'DRAIN-07 · Bayou Culvert Primary Sump',
          description: 'Status: OVERWHELMED (84/100) | Culvert Flash Overflow',
          severity: 'CRITICAL' as const,
          type: 'asset' as const,
        },
        {
          id: 'asset_rd_24',
          lat: 13.058,
          lng: 80.268,
          title: 'RD-24 · Substation 9 Basin Infiltration',
          description: 'Status: INUNDATED (67/100) | Transformer Yard Threatened',
          severity: 'HIGH' as const,
          type: 'asset' as const,
        },
        {
          id: 'asset_hosp_01',
          lat: 13.070,
          lng: 80.282,
          title: 'HOSP-01 · St. Jude Trauma Hub',
          description: 'Status: ACCESS_BLOCKED (42/100) | Gate B Water Ingress +18in',
          severity: 'HIGH' as const,
          type: 'asset' as const,
        },
      ];

  const mapRoutes: [number, number][][] = isNepal
    ? [[[27.6830, 85.3080], [27.6890, 85.3190], [27.6950, 85.3150], [27.6966, 85.3591]]]
    : [[[13.064, 80.276], [13.062, 80.273], [13.058, 80.268], [13.070, 80.282]]];

  // Region-Specific Chain Nodes
  const chainNodes = isNepal
    ? [
        { assetCode: 'BRG-KTM', asset: 'Bagmati River Main Bridge Overflow', impact: 'OVERWHELMED', impactScore: 94 },
        { assetCode: 'HWY-KTM', asset: 'Balkhu Highway Submersion', impact: 'INUNDATED', impactScore: 82 },
        { assetCode: 'HOSP-KTM', asset: 'Tribhuvan Trauma Hub Corridor Severed', impact: 'ACCESS_BLOCKED', impactScore: 76 },
      ]
    : cascadeData?.cascade?.length
    ? cascadeData.cascade
    : [
        { assetCode: 'DRAIN-07', asset: 'Bayou Culvert Flash Overflow', impact: 'OVERWHELMED', impactScore: 84 },
        { assetCode: 'RD-24', asset: 'Substation 9 Basin Infiltration', impact: 'INUNDATED', impactScore: 67 },
        { assetCode: 'HOSP-01', asset: 'Hospital Corridor Severed', impact: 'ACCESS_BLOCKED', impactScore: 42 },
      ];

  const aiSummaryText = isNepal
    ? 'Compound operational risk: Bagmati River flash flood breach threatens Tribhuvan Trauma Hub via Kantipath Lowland Access. Water depth +2.1m. Deploy emergency high-ground barrier and dispatch boat rescue units.'
    : explain?.explanation?.situationSummary || explain?.explanation?.impactSummary || 'Compound operational risk: flood threatens access to St. Jude Regional Medical Center via East Basin Arterial Road R24.';

  const fetchedActions = explain?.explanation?.recommendedActions ?? [];
  const recommendedActionsList = isNepal
    ? [
        { actionId: 'ACT-KTM-01', reason: 'Inspect or clear Bagmati Basin Drain D01 immediately to prevent earliest cascade progression.', priority: 'CRITICAL' },
        { actionId: 'ACT-KTM-02', reason: 'Establish verified alternate transit before Balkhu Highway becomes impassable.', priority: 'CRITICAL' },
      ]
    : fetchedActions.length > 0
    ? fetchedActions
    : [
        { actionId: 'ACT-EB-01', reason: 'Inspect or clear East Basin Drain D07 immediately to prevent earliest cascade progression.', priority: 'CRITICAL' },
        { actionId: 'ACT-EB-02', reason: 'Establish verified alternate transit before East Basin Arterial Road R24 becomes impassable.', priority: 'CRITICAL' },
      ];

  return (
    <GovHqLayout activePath="/gov/zone-cascade/4B">
      <div className="flex flex-col xl:flex-row w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f8f9ff]">
        
        {/* LEFT & CENTER CANVAS: Leaflet Interactive GIS Engine (STREET MAP MODE DEFAULT) */}
        <section className="relative flex-1 h-full min-w-0 bg-slate-900 overflow-hidden">
          {/* Base Leaflet Map Component */}
          <div className="absolute inset-0 z-0">
            <RealLeafletMap
              center={mapCenter}
              zoom={14}
              tileTheme="osm"
              styleSwitcherPosition="bottom-right"
              showUserLocation={true}
              zones={mapZones}
              markers={mapMarkers}
              routes={mapRoutes}
              className="h-full w-full"
            />
          </div>

          {/* Top HUD Header Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-[#e5eeff] text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#0b1c30]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse" />
                <span>{isNepal ? 'Kathmandu Bagmati River Basin' : 'Bayou Crossing & Waterfront'}</span>
              </div>
              <span className="text-[#76777d]">|</span>
              <span className="font-mono text-[#45464d]">GRID #{isNepal ? 'NP-KTM-EOC-01' : 'US-LA-EOC-4B'}</span>
              <span className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#0051d5] font-semibold">
                Hydro-Sensors: 14/14 Online
              </span>
              {liveWeather && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono font-bold flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-600" />
                  {liveWeather.temperatureC}°C · Rain {liveWeather.rainfallMmPerHour} mm/h
                </span>
              )}
            </div>

            {/* Layer Switches */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-[#e5eeff] text-xs font-semibold">
              <button 
                onClick={() => setActiveLayer('hydro')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeLayer === 'hydro' ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Hydrology
              </button>
              <button 
                onClick={() => setActiveLayer('arterials')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeLayer === 'arterials' ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Arterials
              </button>
              <button 
                onClick={() => setActiveLayer('egress')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeLayer === 'egress' ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Egress
              </button>
            </div>
          </div>

          {/* Bottom-Left Floating Landmarks & Telemetry Widget */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 max-w-sm pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-md border border-[#e5eeff] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#ffdad6] text-[#93000a] flex items-center justify-center shrink-0">
                <Hospital className="w-4 h-4 text-[#ba1a1a]" />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[#0b1c30]">
                    {isNepal ? 'Tribhuvan Trauma Hub Gate B' : 'St. Jude Gate B'}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a]">
                    COMPROMISED
                  </span>
                </div>
                <p className="text-[11px] text-[#45464d] mt-0.5 leading-snug">
                  Water ingress {isNepal ? '+2.1m' : '+18in'} across access ramp. Ambulance divert active.
                </p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-[#e5eeff] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0b1c30]">
                {isNepal ? 'Sensor #KTM-09 (Bagmati Basin)' : 'Sensor #4B-09 (Bayshore & 4th)'}
              </span>
              <span className="font-mono font-bold text-[#ba1a1a]">
                +{liveWeather?.rainfallMmPerHour ? Math.round(liveWeather.rainfallMmPerHour * 1.2) : '48.2'} cm/hr Peak
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT CONTEXTUAL PANEL: Analytical Inspector (420px Fixed) */}
        <aside className="w-full xl:w-[420px] xl:min-w-[420px] xl:max-w-[420px] h-full bg-white border-l border-[#e5eeff] flex flex-col justify-between shadow-md z-30 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-white border-b border-[#e5eeff]">
            <div className="flex items-center justify-between text-xs text-[#76777d] uppercase font-bold tracking-wider mb-1">
              <span>Zone Detail & Cascade Impact</span>
              <span className="font-mono text-[#0051d5]">{isNepal ? 'SEC-INC-KTM' : 'SEC-INC-204'}</span>
            </div>
            <h1 className="text-lg font-bold text-[#0b1c30] leading-tight">
              {isNepal
                ? 'Sector inc_ktm: Kathmandu Bagmati River Inundation Corridor'
                : `Sector inc_204: Bayou Crossing Corridor`}
            </h1>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e5eeff]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold uppercase">
                  CRITICAL
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0090a9] text-xs font-semibold">
                  Flood Inundation
                </span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold text-[#ba1a1a]">{isNepal ? 94 : 88}</span>
                <span className="text-xs text-[#76777d]">/100</span>
              </div>
            </div>
          </div>

          {/* Analytical Content */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {/* Cascade Failure Chain */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-[#0b1c30] uppercase tracking-wider block">
                Cascade Failure Chain
              </span>

              {chainNodes.map((node: any, i: number) => {
                const color = chainColors[Math.min(i, chainColors.length - 1)];
                return (
                  <React.Fragment key={node.assetCode ?? i}>
                    {i > 0 && (
                      <div className="flex justify-center text-[#76777d]">
                        <ArrowRight className="w-4 h-4 rotate-90" />
                      </div>
                    )}
                    <div
                      className="p-3 rounded-xl bg-white shadow-xs flex items-start gap-2.5"
                      style={{ borderWidth: 1, borderStyle: 'solid', borderColor: color }}
                    >
                      <span
                        className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: color }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-bold block" style={{ color }}>
                          {node.assetCode ? `${node.assetCode} · ` : ''}{node.asset}
                        </span>
                        <p className="text-[#45464d] text-[11px] mt-0.5">
                          Impact: {String(node.impact ?? node.impactType ?? 'IMPACTED').replace(/_/g, ' ')}
                          {node.impactScore != null ? ` (${node.impactScore}/100)` : ''}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Demographics Exposure */}
            <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#d3e4fe] flex flex-col gap-1.5">
              <span className="font-bold text-xs text-[#0b1c30]">Population & Exposure</span>
              <div className="grid grid-cols-3 gap-2 text-center mt-1">
                <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
                  <span className="text-[10px] text-[#76777d] block font-semibold">Residents</span>
                  <span className="font-bold text-xs text-[#0b1c30]">
                    {isNepal ? '45,000' : (cascadeData?.impact?.residents ?? 14200).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
                  <span className="text-[10px] text-[#76777d] block font-semibold">Mobility-Imp.</span>
                  <span className="font-bold text-xs text-[#dc2626]">{isNepal ? '5,200' : '1,840'}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
                  <span className="text-[10px] text-[#76777d] block font-semibold">Elderly Beds</span>
                  <span className="font-bold text-xs text-[#0b1c30]">{isNepal ? '1,420' : '420'}</span>
                </div>
              </div>
            </div>

            {/* Grounded AI Explanation (XAI) + Operator Approval */}
            <div className="p-3 bg-white rounded-xl border border-[#d3e4fe] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0b1c30] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0051d5]" />
                  AI Situation Explanation
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#0051d5] font-semibold">
                  DETERMINISTIC · 98%
                </span>
              </div>

              <p className="text-[11px] text-[#45464d] leading-snug font-medium">
                {aiSummaryText}
              </p>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider block">
                  Recommended Actions — operator approval required
                </span>
                {recommendedActionsList.map((action: any, i: number) => {
                  const state = approved[i];
                  return (
                    <div
                      key={action?.actionId ?? i}
                      className="p-2 rounded-lg bg-[#f8f9ff] border border-[#e5eeff] flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-[11px] text-[#0b1c30] block">
                          {action?.reason || action?.actionId}
                        </span>
                        {action?.priority && (
                          <span className="text-[9px] font-bold uppercase text-[#b45309]">
                            {action.priority} priority
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        data-action="approve-recommendation"
                        onClick={() => handleApprove(i, action)}
                        disabled={state === 'pending' || state === 'done'}
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-colors ${
                          state === 'done'
                            ? 'bg-emerald-600'
                            : state === 'error'
                            ? 'bg-[#ba1a1a]'
                            : 'bg-[#0f172a] hover:bg-[#1e293b]'
                        } disabled:opacity-70`}
                      >
                        {state === 'done'
                          ? 'Dispatched ✓'
                          : state === 'pending'
                          ? 'Dispatching…'
                          : state === 'error'
                          ? 'Retry'
                          : 'Approve'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white border-t border-[#e5eeff] flex flex-col gap-2">
            <button 
              type="button"
              onClick={handleDispatchMitigation}
              disabled={mitigationDispatched}
              className={`w-full h-11 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
                mitigationDispatched ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{mitigationDispatched ? 'Mitigation Dispatched' : 'Deploy Unified Mitigation Strategy'}</span>
            </button>
          </div>
        </aside>
      </div>
    </GovHqLayout>
  );
};
export default GovZoneCascadePage;
