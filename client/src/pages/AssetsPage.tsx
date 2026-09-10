import React, { useState, useMemo } from 'react';
import {
  Building,
  Search,
  Filter,
  PlusCircle,
  HelpCircle,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Droplets,
  Flame,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { Asset, Ward, AssetRiskAssessment } from '../types';

interface AssetsPageProps {
  assets: Asset[];
  wards: Ward[];
  risks: AssetRiskAssessment[];
  onOpenNewAssetModal: () => void;
  onOpenCreatePlan: (asset: Asset, risk: AssetRiskAssessment) => void;
  onSelectAssetForExplain: (asset: Asset, risk: AssetRiskAssessment) => void;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({
  assets,
  wards,
  risks,
  onOpenNewAssetModal,
  onOpenCreatePlan,
  onSelectAssetForExplain,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(assets[0]?.id || null);

  const riskMap = useMemo(() => {
    const map = new Map<string, AssetRiskAssessment>();
    for (const r of risks) map.set(r.assetId, r);
    return map;
  }, [risks]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.wardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesWard = selectedWard === 'ALL' || asset.wardId === selectedWard;
      const matchesType = selectedType === 'ALL' || asset.type === selectedType;

      const risk = riskMap.get(asset.id);
      const matchesRisk =
        selectedRiskFilter === 'ALL' ||
        (selectedRiskFilter === 'CRITICAL' && (risk?.compositeRiskScore ?? 0) >= 80) ||
        (selectedRiskFilter === 'HIGH' && (risk?.compositeRiskScore ?? 0) >= 60 && (risk?.compositeRiskScore ?? 0) < 80) ||
        (selectedRiskFilter === 'MODERATE' && (risk?.compositeRiskScore ?? 0) >= 35 && (risk?.compositeRiskScore ?? 0) < 60) ||
        (selectedRiskFilter === 'LOW' && (risk?.compositeRiskScore ?? 0) < 35);

      return matchesSearch && matchesWard && matchesType && matchesRisk;
    });
  }, [assets, searchTerm, selectedWard, selectedType, selectedRiskFilter, riskMap]);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const selectedRisk = selectedAsset ? riskMap.get(selectedAsset.id) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-sky-800" />
            <span>Infrastructure & Critical Asset Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered municipal assets evaluated against live hydrological runoff and urban heat stress
          </p>
        </div>

        <button
          onClick={onOpenNewAssetModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-900 hover:bg-sky-800 text-white font-medium text-xs shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Asset Context</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by asset name, type, or ward..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Ward Filter */}
        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="ALL">All Wards</option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="ALL">All Categories</option>
          <option value="HOSPITAL">Hospitals & Healthcare</option>
          <option value="POWER_SUBSTATION">Power Substations</option>
          <option value="METRO_STATION">Metro / Transit Terminals</option>
          <option value="STORMWATER_PUMP">Stormwater Pumps</option>
          <option value="RESIDENTIAL_SETTLEMENT">Informal Settlements</option>
          <option value="CRITICAL_ROAD_JUNCTION">Road Junctions / Underpasses</option>
          <option value="INDUSTRIAL_PARK">Industrial / Tech Parks</option>
        </select>

        {/* Risk Filter */}
        <select
          value={selectedRiskFilter}
          onChange={(e) => setSelectedRiskFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical (80+)</option>
          <option value="HIGH">High (60–79)</option>
          <option value="MODERATE">Moderate (35–59)</option>
          <option value="LOW">Low (&lt;35)</option>
        </select>
      </div>

      {/* Main Grid: Asset Table on Left (8 cols) + Detail Drawer on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">Elevation</th>
                  <th className="py-2.5 px-2">Drainage</th>
                  <th className="py-2.5 px-2">Flood Inundation</th>
                  <th className="py-2.5 px-2">Heat Stress</th>
                  <th className="py-2.5 px-2 text-center">Composite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No assets match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const risk = riskMap.get(asset.id);
                    const score = risk?.compositeRiskScore ?? 20;
                    const isSelected = selectedAsset?.id === asset.id;

                    return (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-sky-50/70 font-medium' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{asset.name}</div>
                          <div className="text-[11px] text-slate-500">{asset.wardName}</div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium">
                            {asset.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-700">{asset.elevationM}m MSL</td>
                        <td className="py-2.5 px-2 text-slate-600">
                          <div>{asset.drainageCapacityMmHr} mm/h</div>
                          <div className="text-[10px] text-slate-400">{asset.drainageQuality}</div>
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-blue-700">
                          {risk?.floodRisk.score}/100 (~{risk?.floodRisk.projectedInundationDepthCm}cm)
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-orange-700">
                          {risk?.heatRisk.score}/100 ({risk?.heatRisk.apparentTempC}°C)
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border ${
                              score >= 80
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : score >= 60
                                ? 'bg-orange-50 text-orange-800 border-orange-300'
                                : score >= 35
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {score}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Selected Asset Inspection Drawer */}
        {selectedAsset && selectedRisk && (
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between text-xs space-y-4">
            <div>
              <div className="pb-3 border-b border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Selected Facility Profile
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  {selectedAsset.name}
                </h3>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedAsset.wardName} &bull; Level {selectedAsset.criticality} Criticality
                </div>
              </div>

              {/* Risk Score & Confidence */}
              <div
                className={`mt-3 p-3 rounded-md border ${
                  selectedRisk.compositeRiskScore >= 80
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : selectedRisk.compositeRiskScore >= 60
                    ? 'bg-orange-50 border-orange-200 text-orange-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {selectedRisk.primaryThreat} RISK STATE
                  </span>
                  <span className="text-xl font-black">{selectedRisk.compositeRiskScore} / 100</span>
                </div>
                <div className="text-[11px] font-semibold mt-0.5">
                  Priority: {selectedRisk.compositeLevel}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Confidence: <strong className="text-slate-700">{selectedRisk.confidence}</strong></span>
                  <span>Pop. Served: {selectedAsset.populationServed.toLocaleString()}</span>
                </div>
              </div>

              {/* Physical & Site Attributes */}
              <div className="mt-3 p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
                <div className="font-semibold text-slate-800 text-[10px] uppercase tracking-wider">
                  Site Vulnerability Parameters
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Elevation:</span>
                  <span className="font-semibold text-slate-800">{selectedAsset.elevationM}m MSL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Drainage Capacity:</span>
                  <span className="font-semibold text-slate-800">{selectedAsset.drainageCapacityMmHr} mm/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Basement Equipment:</span>
                  <span className="font-semibold text-slate-800">{selectedAsset.basementEquipment ? 'Yes (High Exposure)' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Onsite Dewatering Pumps:</span>
                  <span className="font-semibold text-slate-800">{selectedAsset.hasDewateringPumps ? 'Available' : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Past Incidents (12m):</span>
                  <span className="font-semibold text-slate-800">{selectedAsset.historicalIncidentCount ?? 4} recorded</span>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Recommended SOP Directives
                </div>
                <div className="p-2.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                  {selectedRisk.floodRisk.explanation}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                onClick={() => onOpenCreatePlan(selectedAsset, selectedRisk)}
                className="w-full py-2 px-3 rounded-md bg-sky-900 hover:bg-sky-800 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Create Response Plan</span>
              </button>
              <button
                onClick={() => onSelectAssetForExplain(selectedAsset, selectedRisk)}
                className="w-full py-1.5 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
              >
                View Transparent Risk Formula
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
