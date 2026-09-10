import React, { useMemo } from 'react';
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
  ShieldAlert,
  Hospital,
  Zap,
  Train,
  Waves,
  Users,
  Building,
  Navigation,
  ExternalLink,
  Flame,
  CloudRain,
  HelpCircle,
} from 'lucide-react';
import { Ward, Asset, AssetRiskAssessment } from '../types';

interface MapViewProps {
  wards: Ward[];
  assets: Asset[];
  risks: AssetRiskAssessment[];
  onSelectAssetForExplain: (assetId: string) => void;
  onSelectAssetForSOP: (assetId: string) => void;
  selectedWardId?: string;
}

// Function to generate dynamic Leaflet DivIcon based on asset type and risk
function createCustomPin(asset: Asset, risk?: AssetRiskAssessment): L.DivIcon {
  const score = risk?.compositeRiskScore ?? 20;
  const isCritical = score >= 80;
  const isHigh = score >= 60 && score < 80;
  const isModerate = score >= 35 && score < 60;

  let bgColor = 'bg-emerald-600 border-emerald-400 text-white';
  let pulseClass = '';

  if (isCritical) {
    bgColor = 'bg-red-600 border-red-400 text-white';
    pulseClass = 'marker-critical';
  } else if (isHigh) {
    bgColor = 'bg-orange-600 border-orange-400 text-white';
    pulseClass = 'marker-high';
  } else if (isModerate) {
    bgColor = 'bg-amber-600 border-amber-400 text-white';
  }

  let iconSvg = '🏥';
  if (asset.type === 'POWER_SUBSTATION') iconSvg = '⚡';
  else if (asset.type === 'METRO_STATION') iconSvg = '🚇';
  else if (asset.type === 'STORMWATER_PUMP') iconSvg = '🌊';
  else if (asset.type === 'RESIDENTIAL_SETTLEMENT') iconSvg = '🏘️';
  else if (asset.type === 'INDUSTRIAL_PARK') iconSvg = '🏢';
  else if (asset.type === 'CRITICAL_ROAD_JUNCTION') iconSvg = '🚦';

  const html = `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-xl cursor-pointer transition-transform hover:scale-125 ${bgColor} ${pulseClass}">
        <span>${iconSvg}</span>
      </div>
      <div class="absolute -bottom-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-950/90 text-white border border-slate-700 shadow whitespace-nowrap">
        ${score}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

export const MapView: React.FC<MapViewProps> = ({
  wards,
  assets,
  risks,
  onSelectAssetForExplain,
  onSelectAssetForSOP,
  selectedWardId,
}) => {
  // Center of Bangalore
  const defaultCenter: [number, number] = [12.955, 77.635];

  // Map risk assessments by assetId
  const riskMap = useMemo(() => {
    const map = new Map<string, AssetRiskAssessment>();
    for (const r of risks) {
      map.set(r.assetId, r);
    }
    return map;
  }, [risks]);

  return (
    <div className="relative w-full h-[580px] lg:h-[680px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl text-xs flex flex-col gap-1.5">
        <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
          Composite Risk Level
        </span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping inline-block" />
          <span className="text-red-400 font-semibold">Critical (80 - 100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-orange-400 font-medium">High (60 - 79)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-amber-400 font-medium">Moderate (35 - 59)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-emerald-400 font-medium">Low (&lt; 35)</span>
        </div>
        <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
          * Polygons indicate Municipal Wards
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Dark Matter Basemap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Ward Polygons */}
        {wards.map((ward) => {
          const isSelected = selectedWardId === ward.id;
          return (
            <Polygon
              key={ward.id}
              positions={ward.boundaries}
              pathOptions={{
                color: isSelected ? '#06B6D4' : '#3B82F6',
                weight: isSelected ? 3 : 1.5,
                fillColor: isSelected ? '#06B6D4' : '#1E293B',
                fillOpacity: isSelected ? 0.25 : 0.12,
              }}
            >
              <Tooltip sticky>
                <div className="text-xs p-1 text-slate-900">
                  <div className="font-bold">{ward.name}</div>
                  <div>Drainage: {ward.drainageCapacityMmHr} mm/hr</div>
                  <div>Impervious: {ward.imperviousSurfacePct}%</div>
                  <div>Tree Canopy: {ward.treeCanopyPct}%</div>
                  <div>Elevation: ~{ward.avgElevationM}m</div>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Critical Asset Markers */}
        {assets.map((asset) => {
          const risk = riskMap.get(asset.id);
          const icon = createCustomPin(asset, risk);
          const score = risk?.compositeRiskScore ?? 20;

          return (
            <Marker
              key={asset.id}
              position={[asset.location.lat, asset.location.lng]}
              icon={icon}
            >
              <Popup>
                <div className="p-1 max-w-[280px] text-slate-100 font-sans">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-cyan-300 leading-tight">
                        {asset.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{asset.wardName}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${
                        score >= 80
                          ? 'bg-red-900 text-red-200 border border-red-500'
                          : score >= 60
                          ? 'bg-orange-900 text-orange-200 border border-orange-500'
                          : score >= 35
                          ? 'bg-amber-900 text-amber-200 border border-amber-500'
                          : 'bg-emerald-900 text-emerald-200 border border-emerald-500'
                      }`}
                    >
                      RISK {score}/100
                    </span>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Type</span>
                      <span className="font-medium text-slate-200">
                        {asset.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Elevation</span>
                      <span className="font-medium text-slate-200">{asset.elevationM}m MSL</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Flood Inundation</span>
                      <span className="font-medium text-blue-400">
                        {risk?.floodRisk.projectedInundationDepthCm ?? 0} cm depth
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Heat Stress</span>
                      <span className="font-medium text-orange-400">
                        {risk?.heatRisk.apparentTempC ?? 28}°C (Index)
                      </span>
                    </div>
                  </div>

                  {/* Explanation excerpt */}
                  {risk?.floodRisk.explanation && score >= 35 && (
                    <p className="text-[11px] text-slate-300 mb-3 line-clamp-2 italic">
                      "{risk.floodRisk.explanation}"
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-700/80">
                    <button
                      onClick={() => onSelectAssetForExplain(asset.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Explain Risk</span>
                    </button>
                    <button
                      onClick={() => onSelectAssetForSOP(asset.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>View SOP</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
