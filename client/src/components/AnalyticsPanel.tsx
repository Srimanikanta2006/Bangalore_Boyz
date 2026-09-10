import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, TrendingUp, Droplets, Flame, AlertCircle } from 'lucide-react';
import { Ward, Asset, AssetRiskAssessment, WeatherReading } from '../types';

interface AnalyticsPanelProps {
  wards: Ward[];
  assets: Asset[];
  risks: AssetRiskAssessment[];
  weather: WeatherReading | null;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  wards,
  assets,
  risks,
  weather,
}) => {
  // Compute data for Ward Drainage vs Current Rain
  const rainRate = weather?.precipitationRateMmHr ?? 0;
  const wardDrainageData = wards.map((w) => ({
    name: w.name.split(' ')[0],
    drainageCapacity: w.drainageCapacityMmHr,
    currentRain: rainRate,
    deficit: Math.max(0, rainRate - w.drainageCapacityMmHr),
  }));

  // Asset risk distribution data
  const riskDistribution = [
    { name: 'Critical (80+)', count: risks.filter((r) => r.compositeRiskScore >= 80).length, color: '#EF4444' },
    { name: 'High (60-79)', count: risks.filter((r) => r.compositeRiskScore >= 60 && r.compositeRiskScore < 80).length, color: '#F97316' },
    { name: 'Moderate (35-59)', count: risks.filter((r) => r.compositeRiskScore >= 35 && r.compositeRiskScore < 60).length, color: '#F59E0B' },
    { name: 'Low (<35)', count: risks.filter((r) => r.compositeRiskScore < 35).length, color: '#10B981' },
  ];

  // Top 5 Most Vulnerable Assets
  const topVulnerable = [...risks]
    .sort((a, b) => b.compositeRiskScore - a.compositeRiskScore)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Critical Infrastructure Assets</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold">Total</span>
          </div>
          <div className="text-2xl font-black text-white mt-1">{assets.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across {wards.length} Municipal Wards</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Critical Flood Surge Assets</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1">
            {risks.filter((r) => r.floodRisk.level === 'CRITICAL' || r.floodRisk.level === 'HIGH').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Max depth ~{Math.max(...risks.map((r) => r.floodRisk.projectedInundationDepthCm), 0)} cm
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Thermal Stress Exposure</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 mt-1">
            {risks.filter((r) => r.heatRisk.level === 'EMERGENCY' || r.heatRisk.level === 'WARNING').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Apparent Peak: {weather?.apparentTempC ?? 28}°C
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Vulnerable Population Served</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-1">
            {assets.reduce((sum, a) => sum + a.populationServed, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Direct citizens & commuters covered</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Drainage vs Precipitation Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Ward Stormwater Drainage vs Rainfall Intensity</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Comparing current precipitation ({rainRate} mm/hr) against design drainage thresholds
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardDrainageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} label={{ value: 'mm / hr', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#F8FAFC', fontSize: '11px' }}
                />
                <Bar dataKey="drainageCapacity" name="Drain Capacity (mm/h)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="currentRain" name="Current Precipitation (mm/h)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-cyan-400" />
                <span>Asset Vulnerability Distribution</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Composite multi-hazard risk categorization across critical facilities
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#F8FAFC', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Asset Count" radius={[0, 4, 4, 0]}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Most Vulnerable Assets Ranking Table */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>Priority Infrastructure Requiring Immediate Resilience Mitigation</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Ward</th>
                <th className="py-2.5 px-3">Elevation</th>
                <th className="py-2.5 px-3">Flood Risk</th>
                <th className="py-2.5 px-3">Heat Risk</th>
                <th className="py-2.5 px-3">Composite Score</th>
                <th className="py-2.5 px-3">Vulnerability Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topVulnerable.map((risk) => (
                <tr key={risk.assetId} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-bold text-white">{risk.assetName}</td>
                  <td className="py-2.5 px-3 text-slate-400">{risk.wardName}</td>
                  <td className="py-2.5 px-3 font-mono">{risk.location.lat.toFixed(3)}, {risk.location.lng.toFixed(3)}</td>
                  <td className="py-2.5 px-3 font-bold text-blue-400">{risk.floodRisk.score}/100</td>
                  <td className="py-2.5 px-3 font-bold text-orange-400">{risk.heatRisk.score}/100</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-black bg-red-950 text-red-300 border border-red-500">
                      {risk.compositeRiskScore}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{risk.floodRisk.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
