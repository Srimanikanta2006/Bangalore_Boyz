import React, { useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Tooltip,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Filter,
  Search,
  Building,
  AlertTriangle,
  Flame,
  CloudRain,
  ShieldCheck,
  CheckSquare,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
  SlidersHorizontal,
  Info,
  History,
} from 'lucide-react';
import {
  Ward,
  Asset,
  AssetRiskAssessment,
  WeatherReading,
  Incident,
} from '../types';

interface RiskMapPageProps {
  wards: Ward[];
  assets: Asset[];
  risks: AssetRiskAssessment[];
  weather: WeatherReading | null;
  incidents: Incident[];
  onOpenCreatePlan: (asset: Asset, risk: AssetRiskAssessment) => void;
  onNavigate: (route: string) => void;
}

// Function to generate clean professional Leaflet markers
function createMapMarker(asset: Asset, risk?: AssetRiskAssessment, hasActiveIncident?: boolean): L.DivIcon {
  const score = risk?.compositeRiskScore ?? 20;
  const isCritical = score >= 80;
  const isHigh = score >= 60 && score < 80;
  const isModerate = score >= 35 && score < 60;

  // Semantic color styling
  let borderClass = 'border-emerald-600 bg-white text-emerald-800';
  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (isCritical) {
    borderClass = 'border-rose-600 bg-rose-50 text-rose-800 marker-critical-ring';
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
  } else if (isHigh) {
    borderClass = 'border-orange-500 bg-orange-50 text-orange-800';
    badgeClass = 'bg-orange-100 text-orange-800 border-orange-300';
  } else if (isModerate) {
    borderClass = 'border-amber-500 bg-amber-50 text-amber-800';
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  // Functional type letter/icon
  let label = 'H';
  if (asset.type === 'POWER_SUBSTATION') label = 'P';
  else if (asset.type === 'METRO_STATION') label = 'T';
  else if (asset.type === 'STORMWATER_PUMP') label = 'W';
  else if (asset.type === 'RESIDENTIAL_SETTLEMENT') label = 'R';
  else if (asset.type === 'CRITICAL_ROAD_JUNCTION') label = 'J';
  else if (asset.type === 'INDUSTRIAL_PARK') label = 'I';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer">
      <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-[11px] shadow-sm transition-transform hover:scale-110 ${borderClass}">
        ${label}
      </div>
      <div class="absolute -bottom-2 px-1 py-0.2 rounded text-[9px] font-black border shadow-xs whitespace-nowrap ${badgeClass}">
        ${score}
      </div>
      ${
        hasActiveIncident
          ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 border border-white"></span>'
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'leaflet-clean-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export const RiskMapPage: React.FC<RiskMapPageProps> = ({
  wards,
  assets,
  risks,
  weather,
  incidents,
  onOpenCreatePlan,
  onNavigate,
}) => {
  // Center of Bengaluru
  const defaultCenter: [number, number] = [12.95, 77.63];

  // Search & Filters
  const [mapSearch, setMapSearch] = useState('');
  const [selectedHazard, setSelectedHazard] = useState<'ALL' | 'FLOOD' | 'HEAT'>('ALL');
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([
    'CRITICAL',
    'HIGH',
    'MODERATE',
    'LOW',
  ]);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);

  // Layers toggle state
  const [layers, setLayers] = useState({
    floodRisk: true,
    heatRisk: true,
    rainfall: false,
    buildings: true,
    roads: true,
    drainage: true,
    activeIncidents: true,
    historicalIncidents: false,
  });

  // Selected asset for right panel inspection
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(assets[0]?.id || null);

  const riskMap = useMemo(() => {
    const map = new Map<string, AssetRiskAssessment>();
    for (const r of risks) {
      map.set(r.assetId, r);
    }
    return map;
  }, [risks]);

  const activeIncidentAssetIds = useMemo(() => {
    return new Set(incidents.filter((i) => i.status === 'RESPONDING').map((i) => i.assetId));
  }, [incidents]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const risk = riskMap.get(asset.id);
      const score = risk?.compositeRiskScore ?? 20;

      let severity = 'LOW';
      if (score >= 80) severity = 'CRITICAL';
      else if (score >= 60) severity = 'HIGH';
      else if (score >= 35) severity = 'MODERATE';

      if (!selectedSeverities.includes(severity)) return false;

      if (selectedHazard === 'FLOOD' && risk?.primaryThreat !== 'FLOOD') return false;
      if (selectedHazard === 'HEAT' && risk?.primaryThreat !== 'HEAT') return false;

      if (mapSearch.trim()) {
        const query = mapSearch.toLowerCase();
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.wardName.toLowerCase().includes(query) ||
          asset.type.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [assets, riskMap, selectedSeverities, selectedHazard, mapSearch]);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const selectedRisk = selectedAsset ? riskMap.get(selectedAsset.id) : null;
  const selectedHasIncident = selectedAsset ? activeIncidentAssetIds.has(selectedAsset.id) : false;

  const toggleSeverity = (sev: string) => {
    if (selectedSeverities.includes(sev)) {
      if (selectedSeverities.length > 1) {
        setSelectedSeverities(selectedSeverities.filter((s) => s !== sev));
      }
    } else {
      setSelectedSeverities([...selectedSeverities, sev]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] overflow-hidden bg-slate-50">
      {/* Top Map Action Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search location, asset, or municipal ward..."
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Hazard Quick Switchers & Layers Dropdown */}
        <div className="flex items-center gap-2">
          {/* Hazard Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedHazard('ALL')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                selectedHazard === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Hazards
            </button>
            <button
              onClick={() => setSelectedHazard('FLOOD')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                selectedHazard === 'FLOOD'
                  ? 'bg-white text-blue-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CloudRain className="w-3 h-3 text-blue-600" />
              <span>Flood</span>
            </button>
            <button
              onClick={() => setSelectedHazard('HEAT')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                selectedHazard === 'HEAT'
                  ? 'bg-white text-orange-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3 h-3 text-orange-600" />
              <span>Heat</span>
            </button>
          </div>

          {/* Functional Layers Control Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLayerControlOpen(!isLayerControlOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition ${
                isLayerControlOpen
                  ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Layers</span>
            </button>

            {isLayerControlOpen && (
              <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-[1000] text-xs space-y-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Climate Layers
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={layers.floodRisk}
                        onChange={(e) => setLayers({ ...layers, floodRisk: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-0"
                      />
                      <span>Flood Inundation Risk</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={layers.heatRisk}
                        onChange={(e) => setLayers({ ...layers, heatRisk: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-0"
                      />
                      <span>Heat Stress Index</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={layers.rainfall}
                        onChange={(e) => setLayers({ ...layers, rainfall: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-0"
                      />
                      <span>Precipitation Contour</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Infrastructure
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={layers.buildings}
                        onChange={(e) => setLayers({ ...layers, buildings: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-0"
                      />
                      <span>Critical Facilities</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={layers.drainage}
                        onChange={(e) => setLayers({ ...layers, drainage: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-0"
                      />
                      <span>Stormwater Drain Corridors</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Incidents
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={layers.activeIncidents}
                        onChange={(e) => setLayers({ ...layers, activeIncidents: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-0"
                      />
                      <span>Active Incidents</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 3-Column Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Map Filter Panel */}
        <div className="w-56 bg-white border-r border-slate-200 p-3.5 flex flex-col justify-between overflow-y-auto text-xs select-none">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span>Risk Severity</span>
                <span>({filteredAssets.length})</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { key: 'CRITICAL', label: 'Critical (80–100)', color: 'bg-rose-600', count: risks.filter(r => r.compositeRiskScore >= 80).length },
                  { key: 'HIGH', label: 'High (60–79)', color: 'bg-orange-500', count: risks.filter(r => r.compositeRiskScore >= 60 && r.compositeRiskScore < 80).length },
                  { key: 'MODERATE', label: 'Moderate (35–59)', color: 'bg-amber-500', count: risks.filter(r => r.compositeRiskScore >= 35 && r.compositeRiskScore < 60).length },
                  { key: 'LOW', label: 'Low (< 35)', color: 'bg-emerald-600', count: risks.filter(r => r.compositeRiskScore < 35).length },
                ].map((item) => {
                  const isChecked = selectedSeverities.includes(item.key);
                  return (
                    <label
                      key={item.key}
                      onClick={() => toggleSeverity(item.key)}
                      className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                        <span className={`text-[11px] ${isChecked ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.count}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Environmental Summary Bar in Left Panel */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Current Telemetry
              </div>
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Rain Rate:</span>
                  <span className="font-semibold text-slate-900">{weather?.precipitationRateMmHr ?? 0} mm/h</span>
                </div>
                <div className="flex justify-between">
                  <span>Heat Index:</span>
                  <span className="font-semibold text-slate-900">{weather?.apparentTempC ?? 28}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Ground Saturation:</span>
                  <span className="font-semibold text-slate-900">{weather?.soilMoisturePct ?? 35}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-semibold text-emerald-700">
                    {weather?.dataQuality === 'STALE' ? 'LOW (Delayed)' : 'HIGH'}
                  </span>
                </div>
              </div>
            </div>

            {/* Map Legend */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Asset Marker Types
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div><span className="font-bold">H:</span> Hospital</div>
                <div><span className="font-bold">P:</span> Substation</div>
                <div><span className="font-bold">T:</span> Transit/Metro</div>
                <div><span className="font-bold">W:</span> Storm Drain</div>
                <div><span className="font-bold">J:</span> Underpass</div>
                <div><span className="font-bold">R:</span> Settlement</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('assets')}
              className="w-full py-1.5 px-2 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 text-center transition"
            >
              Open Full Asset Register &rarr;
            </button>
          </div>
        </div>

        {/* Center: Large Interactive Geospatial Map */}
        <div className="flex-1 relative h-full">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            {/* Clean Professional CartoDB Voyager / Light Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Ward Geographic Polygons (Transparent Risk Zones) */}
            {wards.map((ward) => {
              // Determine average ward risk level for polygon shading
              const wardAssets = assets.filter((a) => a.wardId === ward.id);
              const wardScores = wardAssets.map((a) => riskMap.get(a.id)?.compositeRiskScore ?? 20);
              const avgScore = wardScores.length > 0 ? wardScores.reduce((a, b) => a + b, 0) / wardScores.length : 20;

              let fillColor = '#10B981'; // Green
              let strokeColor = '#059669';
              if (avgScore >= 80) {
                fillColor = '#E11D48'; // Red
                strokeColor = '#BE123C';
              } else if (avgScore >= 60) {
                fillColor = '#F97316'; // Orange
                strokeColor = '#C2410C';
              } else if (avgScore >= 35) {
                fillColor = '#F59E0B'; // Yellow
                strokeColor = '#D97706';
              }

              return (
                <Polygon
                  key={ward.id}
                  positions={ward.boundaries}
                  pathOptions={{
                    color: strokeColor,
                    weight: 1.5,
                    fillColor: fillColor,
                    fillOpacity: 0.12, // Translucent so roads & terrain are clearly visible!
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs p-1 text-slate-900">
                      <div className="font-bold text-slate-900">{ward.name}</div>
                      <div>Avg Zone Risk: <span className="font-bold">{Math.round(avgScore)}/100</span></div>
                      <div>Drain Capacity: {ward.drainageCapacityMmHr} mm/hr</div>
                      <div>Impervious: {ward.imperviousSurfacePct}%</div>
                      <div>Canopy Cover: {ward.treeCanopyPct}%</div>
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}

            {/* Asset Markers */}
            {filteredAssets.map((asset) => {
              const risk = riskMap.get(asset.id);
              const hasIncident = activeIncidentAssetIds.has(asset.id);
              const icon = createMapMarker(asset, risk, hasIncident);
              const score = risk?.compositeRiskScore ?? 20;

              return (
                <Marker
                  key={asset.id}
                  position={[asset.location.lat, asset.location.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedAssetId(asset.id);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-3 w-64 text-slate-900 text-xs font-sans">
                      <div className="font-bold text-sm text-slate-900 mb-0.5">
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mb-2">
                        {asset.wardName} &bull; {asset.type.replace('_', ' ')}
                      </div>

                      {/* Operational Metrics */}
                      <div className="p-2 rounded-md bg-slate-50 border border-slate-200 mb-2 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Composite Risk:</span>
                          <span className={`font-bold ${score >= 80 ? 'text-rose-700' : score >= 60 ? 'text-orange-700' : 'text-slate-900'}`}>
                            {score} / 100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Current Rainfall:</span>
                          <span className="font-semibold text-slate-900">{weather?.precipitationRateMmHr ?? 0} mm/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Drainage Capacity:</span>
                          <span className="font-semibold text-slate-900">{asset.drainageCapacityMmHr} mm/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Elevation:</span>
                          <span className="font-semibold text-slate-900">{asset.elevationM}m MSL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Historical Incidents:</span>
                          <span className="font-semibold text-slate-900">{asset.historicalIncidentCount ?? 4}</span>
                        </div>
                      </div>

                      {/* Button to open in side panel */}
                      <button
                        onClick={() => setSelectedAssetId(asset.id)}
                        className="w-full py-1 px-2 rounded bg-sky-700 hover:bg-sky-800 text-white font-medium text-[11px] transition text-center"
                      >
                        Inspect Risk Details &rarr;
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Right: Risk Details & Selected Asset Panel */}
        {selectedAsset && selectedRisk && (
          <div className="w-80 bg-white border-l border-slate-200 p-4 flex flex-col justify-between overflow-y-auto text-xs">
            <div>
              {/* Header */}
              <div className="border-b border-slate-200 pb-3 mb-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  <span>Asset Operational Detail</span>
                  <span className="font-mono text-slate-500">ID: {selectedAsset.id}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  {selectedAsset.name}
                </h3>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedAsset.wardName} &bull; Level {selectedAsset.criticality} Criticality
                </div>
              </div>

              {/* Current Risk Summary Banner */}
              <div
                className={`p-3 rounded-lg border mb-3 ${
                  selectedRisk.compositeRiskScore >= 80
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : selectedRisk.compositeRiskScore >= 60
                    ? 'bg-orange-50 border-orange-200 text-orange-900'
                    : selectedRisk.compositeRiskScore >= 35
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {selectedRisk.primaryThreat} RISK
                  </span>
                  <span className="text-xl font-black">
                    {selectedRisk.compositeRiskScore} / 100
                  </span>
                </div>
                <div className="text-[11px] font-semibold mt-0.5">
                  {selectedRisk.compositeLevel} Priority State
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Confidence: <strong className="text-slate-700">{selectedRisk.confidence}</strong></span>
                  {selectedHasIncident && (
                    <span className="text-rose-700 font-bold">● Active Incident</span>
                  )}
                </div>
              </div>

              {/* Environmental Telemetry */}
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Current Environmental Telemetry
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Rainfall</span>
                    <span className="font-semibold text-slate-900">{weather?.precipitationRateMmHr ?? 0} mm/h</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Drain Deficit</span>
                    <span className={`font-semibold ${selectedRisk.floodRisk.drainageDeficitMmHr > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                      {selectedRisk.floodRisk.drainageDeficitMmHr} mm/h
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Water Depth</span>
                    <span className="font-semibold text-blue-700">
                      ~{selectedRisk.floodRisk.projectedInundationDepthCm} cm
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Apparent Heat</span>
                    <span className="font-semibold text-orange-700">
                      {selectedRisk.heatRisk.apparentTempC}°C
                    </span>
                  </div>
                </div>
              </div>

              {/* Explainability: "Why is this asset at risk?" */}
              <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Why is this asset at risk?</span>
                  <span className="text-slate-400">Factor Weights</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Precipitation Hazard</span>
                    <span className="font-bold text-slate-900">
                      {selectedRisk.floodRisk.factors.hazardContribution}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Drainage Deficit</span>
                    <span className="font-bold text-rose-700">
                      {selectedRisk.floodRisk.factors.vulnerabilityContribution}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Elevation Deficit (881m)</span>
                    <span className="font-bold text-amber-700">
                      {selectedRisk.floodRisk.factors.exposureContribution}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Pump Buffer Mitigation</span>
                    <span className="font-bold text-emerald-700">
                      -{selectedRisk.floodRisk.factors.resilienceMitigation}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Recommended Operational Actions
                </div>
                <div className="space-y-1">
                  <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-800">
                    {selectedAsset.type === 'POWER_SUBSTATION'
                      ? 'Deploy barrier deflectors to prevent 11kV transformer short-circuit.'
                      : selectedAsset.type === 'HOSPITAL'
                      ? 'Verify ICU basement flood barrier & check generator transfer switch.'
                      : selectedAsset.type === 'CRITICAL_ROAD_JUNCTION'
                      ? 'Place road detour barricades and clear clogged storm drain grates.'
                      : 'Deploy auxiliary dewatering pumps and notify emergency teams.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Action Button: Create Response Plan */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                onClick={() => onOpenCreatePlan(selectedAsset, selectedRisk)}
                className="w-full py-2 px-3 rounded-lg bg-sky-900 hover:bg-sky-800 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Create Response Plan</span>
              </button>

              <div className="text-[10px] text-slate-400 text-center">
                Assigns field response squads & initiates Incident #
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
