import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import {
  Building2, Search, AlertTriangle, Zap, Droplet, RefreshCw, FileText,
} from 'lucide-react';
import { fetchInfrastructureAssets, type InfrastructureAssetCard } from '../../services/api';

const VULNERABLE_THRESHOLD = 70;

function telemetryLabel(minutes: number | null): string {
  if (minutes == null) return 'No telemetry';
  if (minutes < 1) return 'Live (just now)';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export const GovCriticalAssetMonitorPage: React.FC = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState<InfrastructureAssetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await fetchInfrastructureAssets({ limit: 100 });
      setAssets(result.items);
      setError(null);
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to load infrastructure assets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real, derived category counts (not hardcoded).
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assets) counts.set(a.type, (counts.get(a.type) ?? 0) + 1);
    return [
      { id: 'all', label: `All Facilities (${assets.length})` },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ id: type, label: `${type.replace(/_/g, ' ')} (${count})` })),
    ];
  }, [assets]);

  const filteredAssets = assets.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.type === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.assetCode.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  }).sort((a, b) => b.vulnerability - a.vulnerability);

  // Real, derived summary metrics (no invented percentages).
  const vulnerableCount = assets.filter((a) => a.vulnerability >= VULNERABLE_THRESHOLD).length;
  const criticalStatusCount = assets.filter((a) => a.operationalStatus === 'COMPROMISED' || a.operationalStatus === 'OFFLINE').length;
  const backupPowerEligible = assets.filter((a) => a.failoverPower != null || a.backupPower != null);
  const backupPowerCovered = backupPowerEligible.filter((a) => a.failoverPower || a.backupPower).length;
  const backupPowerPct = backupPowerEligible.length ? Math.round((backupPowerCovered / backupPowerEligible.length) * 100) : null;
  const drains = assets.filter((a) => a.type === 'DRAIN' || a.type === 'PUMPING_STATION');
  const drainsOperational = drains.filter((a) => a.operationalStatus === 'OPERATIONAL').length;
  const drainReadinessPct = drains.length ? Math.round((drainsOperational / drains.length) * 100) : null;

  return (
    <GovHqLayout activePath="/gov/critical-assets">
      <div className="p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#dce9ff] text-[#0051d5] text-xs font-bold uppercase tracking-wider">
                Deterministic Risk Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-1">
              Critical Asset &amp; Infrastructure Readiness
            </h1>
            <p className="text-xs text-[#45464d] mt-0.5">
              Real vulnerability/criticality scores and operational status from the deterministic risk engine — not estimates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={load} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#0b1c30] hover:bg-[#eff4ff] text-xs font-semibold border border-[#e5eeff] shadow-xs">
              <RefreshCw className={`w-3.5 h-3.5 text-[#0051d5] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Feeds</span>
            </button>
            <button type="button" onClick={() => navigate('/gov/response-center')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-bold shadow-sm">
              <FileText className="w-3.5 h-3.5" />
              <span>Open Response Center</span>
            </button>
          </div>
        </div>

        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{error}</div>}

        {/* Summary Bento Cards — all real, derived from fetched data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#76777d] uppercase font-bold">
              <span>Monitored Facilities</span>
              <Building2 className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0b1c30]">{loading ? '—' : assets.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#dc2626] uppercase font-bold">
              <span>Vulnerable Assets</span>
              <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#dc2626]">{loading ? '—' : vulnerableCount}</span>
              <span className="text-xs text-[#93000a]">vulnerability ≥ {VULNERABLE_THRESHOLD}</span>
            </div>
            {criticalStatusCount > 0 && (
              <span className="text-[11px] text-[#dc2626] font-semibold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse" />
                {criticalStatusCount} compromised/offline
              </span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#76777d] uppercase font-bold">
              <span>Drainage Readiness</span>
              <Droplet className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0b1c30]">{drainReadinessPct != null ? `${drainReadinessPct}%` : 'N/A'}</span>
            </div>
            <span className="text-[11px] text-[#45464d] mt-1">{drainsOperational}/{drains.length} drains/pumps operational</span>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#76777d] uppercase font-bold">
              <span>Backup Power Coverage</span>
              <Zap className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0b1c30]">{backupPowerPct != null ? `${backupPowerPct}%` : 'N/A'}</span>
            </div>
            <span className="text-[11px] text-[#45464d] mt-1">{backupPowerCovered}/{backupPowerEligible.length} facilities with data</span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs font-semibold">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    activeCategory === cat.id ? 'bg-[#0f172a] text-white shadow-xs' : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#e5eeff]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative flex items-center w-60 shrink-0">
              <Search className="w-4 h-4 text-[#76777d] absolute left-3" />
              <input
                type="text"
                placeholder="Search asset or code…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#eff4ff] text-xs text-[#0b1c30] border border-[#d3e4fe] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Asset Inventory — real per-asset data */}
        <div className="flex flex-col gap-3">
          {!loading && filteredAssets.length === 0 && (
            <div className="p-8 text-center text-sm text-[#76777d] bg-white rounded-2xl border border-[#e5eeff]">No assets match this filter.</div>
          )}
          {filteredAssets.map((asset) => (
            <div key={asset.id} className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden hover:border-[#0051d5] transition-all">
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${asset.vulnerability > 90 ? 'bg-[#dc2626]' : asset.vulnerability >= VULNERABLE_THRESHOLD ? 'bg-[#ea580c]' : 'bg-[#16a34a]'}`} />

              <div className="flex flex-col gap-1 pl-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-[#0b1c30]">{asset.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    asset.vulnerability > 90 ? 'bg-[#fee2e2] text-[#b91c1c]' : asset.vulnerability >= VULNERABLE_THRESHOLD ? 'bg-[#ffedd5] text-[#c2410c]' : 'bg-[#dcfce7] text-[#15803d]'
                  }`}>
                    {asset.criticality} · Vuln {asset.vulnerability}/100
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#45464d] text-[10px]">{asset.type.replace(/_/g, ' ')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    asset.operationalStatus === 'OPERATIONAL' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#ffedd5] text-[#c2410c]'
                  }`}>
                    {asset.operationalStatus}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
                  <span className="text-[#0b1c30] font-semibold">{asset.zone?.name ?? 'No zone'}</span>
                  {asset.activeIncidents > 0 && (
                    <>
                      <span className="text-[#76777d]">•</span>
                      <span className="text-[#dc2626] font-mono">{asset.activeIncidents} active incident(s)</span>
                    </>
                  )}
                  {asset.activeTasks > 0 && (
                    <>
                      <span className="text-[#76777d]">•</span>
                      <span className="text-[#0051d5] font-mono">{asset.activeTasks} active task(s)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 px-3 py-2 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] shrink-0 text-xs">
                <div>
                  <span className="text-[10px] text-[#76777d] block uppercase font-bold">Risk Score</span>
                  <span className="font-bold text-[#0b1c30] font-mono">{asset.risk.score}/100 ({asset.risk.level})</span>
                </div>
                <div className="w-px h-6 bg-[#dce9ff]" />
                <div>
                  <span className="text-[10px] text-[#76777d] block uppercase font-bold">Telemetry</span>
                  <span className="font-bold text-[#0051d5] font-mono">{telemetryLabel(asset.telemetryDelayMinutes)}</span>
                </div>
                <button
                  onClick={() => asset.zone && navigate(`/gov/zone-cascade/${asset.zone.id}`)}
                  disabled={!asset.zone}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-[#0f172a] text-white font-semibold text-xs hover:bg-[#1e293b] transition-colors disabled:opacity-50"
                >
                  View Zone Cascade
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GovHqLayout>
  );
};
export default GovCriticalAssetMonitorPage;
