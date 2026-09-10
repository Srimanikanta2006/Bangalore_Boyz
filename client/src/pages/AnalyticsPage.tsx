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
} from 'recharts';
import { BarChart3, TrendingUp, Droplets, Flame, AlertCircle } from 'lucide-react';
import { Ward, Asset, AssetRiskAssessment, WeatherReading } from '../types';

interface AnalyticsPageProps {
  wards: Ward[];
  assets: Asset[];
  risks: AssetRiskAssessment[];
  weather: WeatherReading | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  wards,
  assets,
  risks,
  weather,
}) => {
  const rainRate = weather?.precipitationRateMmHr ?? 0;
  const wardDrainageData = wards.map((w) => ({
    name: w.name.split(' ')[0],
    drainageCapacity: w.drainageCapacityMmHr,
    currentRain: rainRate,
    deficit: Math.max(0, rainRate - w.drainageCapacityMmHr),
  }));

  const riskDistribution = [
    { name: 'Critical (80+)', count: risks.filter((r) => r.compositeRiskScore >= 80).length, color: '#E11D48' },
    { name: 'High (60–79)', count: risks.filter((r) => r.compositeRiskScore >= 60 && r.compositeRiskScore < 80).length, color: '#F97316' },
    { name: 'Moderate (35–59)', count: risks.filter((r) => r.compositeRiskScore >= 35 && r.compositeRiskScore < 60).length, color: '#F59E0B' },
    { name: 'Low (<35)', count: risks.filter((r) => r.compositeRiskScore < 35).length, color: '#10B981' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-800" />
          <span>Operational Risk Intelligence & Hydrological Analytics</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quantified capacity benchmarking, rainfall stress margins, and municipal vulnerability distributions
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-xs text-slate-500">Monitored Facilities</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{assets.length} Assets</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 7 Municipal Wards</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-xs text-slate-500">Hydrological Drain Deficit</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {Math.max(...wardDrainageData.map(d => d.deficit))} mm/h
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Peak pluvial surcharge rate</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-xs text-slate-500">Peak Thermal Index</div>
          <div className="text-2xl font-black text-orange-700 mt-1">
            {weather?.apparentTempC ?? 28}°C
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Wet-Bulb WBGT monitored</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-xs text-slate-500">Citizen & Commuter Coverage</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {assets.reduce((sum, a) => sum + a.populationServed, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Direct population served</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Stormwater Drainage vs Precipitation */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-xs">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ward Stormwater Drainage Capacity vs Rainfall
            </h3>
            <p className="text-[11px] text-slate-500">
              Comparing current precipitation ({rainRate} mm/hr) against design drainage thresholds
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardDrainageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} label={{ value: 'mm / hr', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '0.375rem', fontSize: '11px' }}
                />
                <Bar dataKey="drainageCapacity" name="Drain Capacity (mm/h)" fill="#0284C7" radius={[2, 2, 0, 0]} />
                <Bar dataKey="currentRain" name="Current Rain (mm/h)" fill="#2563EB" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Classification Distribution */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-xs">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Asset Vulnerability Classification
            </h3>
            <p className="text-[11px] text-slate-500">
              Distribution of infrastructure assets across standardized risk tiers
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '0.375rem', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Asset Count" radius={[0, 2, 2, 0]}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
