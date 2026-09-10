import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Hospital,
  Zap,
  Train,
  Waves,
  Building,
  Users,
  Navigation,
  HelpCircle,
  ShieldAlert,
  Flame,
  CloudRain,
  SlidersHorizontal,
} from 'lucide-react';
import { Asset, Ward, AssetRiskAssessment } from '../types';

interface AssetRegisterProps {
  assets: Asset[];
  wards: Ward[];
  risks: AssetRiskAssessment[];
  onSelectAssetForExplain: (assetId: string) => void;
  onSelectAssetForSOP: (assetId: string) => void;
}

export const AssetRegister: React.FC<AssetRegisterProps> = ({
  assets,
  wards,
  risks,
  onSelectAssetForExplain,
  onSelectAssetForSOP,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'elevation' | 'criticality'>('risk');

  const riskMap = useMemo(() => {
    const map = new Map<string, AssetRiskAssessment>();
    for (const r of risks) {
      map.set(r.assetId, r);
    }
    return map;
  }, [risks]);

  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        const matchesSearch =
          asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.wardName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWard = selectedWard === 'ALL' || asset.wardId === selectedWard;
        const matchesType = selectedType === 'ALL' || asset.type === selectedType;

        const risk = riskMap.get(asset.id);
        const matchesRisk =
          selectedRiskLevel === 'ALL' ||
          (risk && risk.compositeLevel === selectedRiskLevel);

        return matchesSearch && matchesWard && matchesType && matchesRisk;
      })
      .sort((a, b) => {
        const riskA = riskMap.get(a.id)?.compositeRiskScore ?? 0;
        const riskB = riskMap.get(b.id)?.compositeRiskScore ?? 0;
        if (sortBy === 'risk') return riskB - riskA;
        if (sortBy === 'elevation') return a.elevationM - b.elevationM; // Lowest first (more flood prone)
        if (sortBy === 'criticality') return b.criticality - a.criticality;
        return 0;
      });
  }, [assets, searchTerm, selectedWard, selectedType, selectedRiskLevel, sortBy, riskMap]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 lg:p-6 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            Critical Infrastructure & Asset Vulnerability Register
          </h2>
          <p className="text-xs text-slate-400">
            Evaluating {assets.length} municipal assets across {wards.length} zones for flood inundation and heat vulnerability
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search asset or ward..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5 pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Filters:</span>
        </div>

        {/* Ward Filter */}
        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Municipal Wards</option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Asset Types</option>
          <option value="HOSPITAL">Hospitals & Healthcare</option>
          <option value="POWER_SUBSTATION">Power Substations</option>
          <option value="METRO_STATION">Metro & Transit</option>
          <option value="STORMWATER_PUMP">Stormwater Pumps</option>
          <option value="RESIDENTIAL_SETTLEMENT">Informal Settlements</option>
          <option value="CRITICAL_ROAD_JUNCTION">Road Junctions / Underpasses</option>
          <option value="INDUSTRIAL_PARK">Tech / Industrial Parks</option>
        </select>

        {/* Risk Level Filter */}
        <select
          value={selectedRiskLevel}
          onChange={(e) => setSelectedRiskLevel(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">🔴 Critical Only (80+)</option>
          <option value="HIGH">🟠 High Only (60-79)</option>
          <option value="MODERATE">🟡 Moderate Only (35-59)</option>
          <option value="LOW">🟢 Low Only (&lt;35)</option>
        </select>

        {/* Sort selector */}
        <div className="ml-auto flex items-center gap-1.5 text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="risk">Composite Risk (Highest)</option>
            <option value="elevation">Elevation (Lowest first)</option>
            <option value="criticality">Criticality Level</option>
          </select>
        </div>
      </div>

      {/* Asset Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Asset Name & Ward</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Elevation & Topo</th>
              <th className="py-3 px-3">Drainage Capacity</th>
              <th className="py-3 px-3">Pluvial Flood Risk</th>
              <th className="py-3 px-3">Heat Stress Index</th>
              <th className="py-3 px-3 text-center">Composite Risk</th>
              <th className="py-3 px-4 text-right">Action Playbook</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                  No critical assets match the specified filters.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const risk = riskMap.get(asset.id);
                const score = risk?.compositeRiskScore ?? 20;

                return (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-800/50 transition duration-150"
                  >
                    {/* Name & Ward */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 text-sm">
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{asset.wardName}</span>
                        <span>&bull;</span>
                        <span>Serves {asset.populationServed.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium whitespace-nowrap">
                        {asset.type.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Elevation */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-200">{asset.elevationM}m MSL</div>
                      <div className="text-[10px] text-slate-400">
                        {asset.elevationM < 882 ? (
                          <span className="text-red-400">Low Valley Floor</span>
                        ) : asset.elevationM < 895 ? (
                          <span className="text-amber-400">Moderate Basin</span>
                        ) : (
                          <span className="text-emerald-400">High Ridge</span>
                        )}
                      </div>
                    </td>

                    {/* Drainage */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-200">
                        {asset.drainageCapacityMmHr} mm/hr
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {asset.hasDewateringPumps ? (
                          <span className="text-emerald-400 font-medium">✓ Sump Pump Ready</span>
                        ) : (
                          <span className="text-slate-500">No Onsite Pump</span>
                        )}
                      </div>
                    </td>

                    {/* Flood Risk */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                        <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${risk?.floodRisk.score ?? 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs text-blue-300">
                          {risk?.floodRisk.score ?? 0}
                        </span>
                      </div>
                      {risk && risk.floodRisk.projectedInundationDepthCm > 0 && (
                        <div className="text-[10px] text-blue-400 font-semibold mt-0.5">
                          Depth ~{risk.floodRisk.projectedInundationDepthCm}cm
                        </div>
                      )}
                    </td>

                    {/* Heat Risk */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${risk?.heatRisk.score ?? 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs text-orange-300">
                          {risk?.heatRisk.score ?? 0}
                        </span>
                      </div>
                      <div className="text-[10px] text-orange-400/80 mt-0.5">
                        {risk?.heatRisk.apparentTempC ?? 28}°C Apparent
                      </div>
                    </td>

                    {/* Composite Risk Score */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-black tracking-wide border shadow-sm ${
                          score >= 80
                            ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                            : score >= 60
                            ? 'bg-orange-950/80 border-orange-500 text-orange-300'
                            : score >= 35
                            ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                            : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        }`}
                      >
                        {score} / 100
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectAssetForExplain(asset.id)}
                          title="Explain Risk Drivers"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 transition"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectAssetForSOP(asset.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition hover:scale-[1.02]"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>SOP</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
