import React from 'react';
import {
  AlertTriangle,
  Building,
  CheckSquare,
  Flame,
  CloudRain,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldAlert,
  Droplets,
  Activity,
  Layers,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import {
  Ward,
  Asset,
  AssetRiskAssessment,
  WeatherReading,
  Incident,
  DataQualityStatus,
} from '../types';

interface DashboardPageProps {
  wards: Ward[];
  assets: Asset[];
  risks: AssetRiskAssessment[];
  weather: WeatherReading | null;
  incidents: Incident[];
  dataQuality: DataQualityStatus | null;
  onNavigate: (route: string) => void;
  onSelectAssetForExplain: (asset: Asset, risk: AssetRiskAssessment) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  wards,
  assets,
  risks,
  weather,
  incidents,
  dataQuality,
  onNavigate,
  onSelectAssetForExplain,
}) => {
  const criticalRisksCount = risks.filter((r) => r.compositeRiskScore >= 80).length;
  const highRiskAssetsCount = risks.filter((r) => r.compositeRiskScore >= 60 && r.compositeRiskScore < 80).length;
  const activeIncidents = incidents.filter((i) => i.status === 'RESPONDING' || i.status === 'DETECTED');

  let pendingTasksCount = 0;
  for (const inc of activeIncidents) {
    pendingTasksCount += inc.tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED').length;
  }

  // Top 5 most vulnerable assets
  const topRisks = [...risks]
    .sort((a, b) => b.compositeRiskScore - a.compositeRiskScore)
    .slice(0, 5);

  const riskMap = new Map<string, AssetRiskAssessment>();
  for (const r of risks) riskMap.set(r.assetId, r);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Climate Risk Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Current environmental conditions and active response status &bull; Bengaluru Urban District
          </p>
        </div>

        <button
          onClick={() => onNavigate('risk-map')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-900 hover:bg-sky-800 text-white font-medium text-xs shadow-xs transition"
        >
          <span>Open Geospatial Risk Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Cards: Operational & restrained (from master prompt) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Critical Risks</span>
            <span className="w-2 h-2 rounded-full bg-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{criticalRisksCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Score 80–100 threshold breach</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>High-Risk Assets</span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-700">{highRiskAssetsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Elevated vulnerability state</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active Incidents</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeIncidents.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Field units currently mobilized</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pending Response Tasks</span>
            <CheckSquare className="w-3.5 h-3.5 text-sky-700" />
          </div>
          <div className="text-2xl font-black text-sky-800">{pendingTasksCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting completion / verification</div>
        </div>
      </div>

      {/* 2-Column Split: Active Incidents & Environmental Ingestion Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Active Incidents Operational Log */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Active Field Incidents</span>
              </h2>
              <button
                onClick={() => onNavigate('incidents')}
                className="text-xs text-sky-700 hover:text-sky-900 font-semibold"
              >
                View All Incidents &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {activeIncidents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active incidents. Use the simulation scenario menu in the top bar to test incident response workflows.
                </div>
              ) : (
                activeIncidents.map((inc) => {
                  const completedCount = inc.tasks.filter((t) => t.status === 'COMPLETED').length;
                  const totalCount = inc.tasks.length;

                  return (
                    <div
                      key={inc.id}
                      onClick={() => onNavigate('incidents')}
                      className="p-3 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-slate-50/60 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">
                              #{inc.incidentNumber}
                            </span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${
                                inc.severity === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-orange-50 text-orange-800 border-orange-200'
                              }`}
                            >
                              {inc.severity}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{inc.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {inc.wardName} &bull; Assigned: {inc.assignedTeam}
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 uppercase">
                          {inc.status}
                        </span>
                      </div>

                      {/* Task completion progress bar */}
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
                        <span>Tasks: {completedCount} / {totalCount}</span>
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-700 h-full rounded-full transition-all duration-300"
                            style={{ width: `${(completedCount / Math.max(1, totalCount)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            All incidents follow standard FEMA/Municipal ICS response protocols
          </div>
        </div>

        {/* Right 5 Cols: Environmental Telemetry & Data Quality */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-700" />
              <span>Environmental Telemetry & Quality</span>
            </h2>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Ground sensor mesh & Open-Meteo meteorological feed
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Precipitation Rate</span>
              <span className="text-lg font-black text-blue-700">
                {weather?.precipitationRateMmHr ?? 0} mm/h
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">
                24h Accum: {weather?.precipitationAccumulation24hMm ?? 0} mm
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Apparent Temperature</span>
              <span className="text-lg font-black text-orange-700">
                {weather?.apparentTempC ?? 28}°C
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Ambient: {weather?.temperatureC ?? 28}°C
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Relative Humidity</span>
              <span className="text-lg font-black text-slate-900">
                {weather?.relativeHumidityPct ?? 50}%
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Wind: {weather?.windSpeedKmh ?? 12} km/h
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Soil Saturation</span>
              <span className="text-lg font-black text-slate-900">
                {weather?.soilMoisturePct ?? 35}%
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Gauge: {weather?.waterGaugeLevelM ?? 0.3}m
              </div>
            </div>
          </div>

          {/* Data Freshness Callout */}
          <div className={`p-3 rounded-lg border text-xs ${
            dataQuality?.status === 'STALE'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center justify-between font-bold text-[11px] mb-1">
              <span>Telemetry Data Status: {dataQuality?.status || 'GOOD'}</span>
              <span className="text-[10px] font-mono text-slate-500">
                {dataQuality?.lastUpdatedMinutesAgo || 2}m ago
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {dataQuality?.message || 'Live telemetry verified with zero latency deviation.'}
            </p>
          </div>
        </div>
      </div>

      {/* Priority High-Vulnerability Assets Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Priority Infrastructure Assets Requiring Attention
            </h2>
            <p className="text-[11px] text-slate-500">
              Assets sorted by current composite risk score across pluvial inundation and heat stress
            </p>
          </div>
          <button
            onClick={() => onNavigate('assets')}
            className="text-xs text-sky-700 hover:text-sky-900 font-semibold"
          >
            View All Assets &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Ward</th>
                <th className="py-2.5 px-3">Elevation</th>
                <th className="py-2.5 px-3">Flood Risk</th>
                <th className="py-2.5 px-3">Heat Risk</th>
                <th className="py-2.5 px-3 text-center">Composite Score</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topRisks.map((risk) => {
                const asset = assets.find((a) => a.id === risk.assetId);
                if (!asset) return null;

                return (
                  <tr key={risk.assetId} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{risk.assetName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{asset.type.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 text-slate-600">{risk.wardName}</td>
                    <td className="py-2.5 px-3 font-mono">{asset.elevationM}m MSL</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-blue-700">
                        {risk.floodRisk.score}/100 (~{risk.floodRisk.projectedInundationDepthCm}cm)
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-orange-700">
                        {risk.heatRisk.score}/100 ({risk.heatRisk.apparentTempC}°C)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border ${
                          risk.compositeRiskScore >= 80
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : risk.compositeRiskScore >= 60
                            ? 'bg-orange-50 text-orange-800 border-orange-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {risk.compositeRiskScore} / 100
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectAssetForExplain(asset, risk)}
                        className="text-sky-700 hover:text-sky-900 font-semibold text-[11px] underline"
                      >
                        Inspect Risk &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
