import React from 'react';
import {
  ShieldAlert,
  CloudRain,
  Sun,
  Flame,
  Activity,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { WeatherReading, CitySummaryStats } from '../types';

interface HeaderProps {
  weather: WeatherReading | null;
  stats: CitySummaryStats | null;
  onRefreshLive: () => void;
  onOpenNewAsset: () => void;
  onSelectTab: (tab: 'map' | 'assets' | 'alerts' | 'analytics') => void;
  activeTab: 'map' | 'assets' | 'alerts' | 'analytics';
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  weather,
  stats,
  onRefreshLive,
  onOpenNewAsset,
  onSelectTab,
  activeTab,
  isRefreshing,
}) => {
  const resilienceScore = stats?.cityResilienceIndex ?? 75;
  const criticalCount = stats?.criticalCount ?? 0;
  const activeAlerts = stats?.activeAlertsCount ?? 0;

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-6 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/50">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                ClimateShield
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                Resilience v1.0
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Mesh
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Urban Climate Risk, Heat & Flood Resilience Platform &bull; Bengaluru Smart City
            </p>
          </div>
        </div>

        {/* Environmental Ingestion Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {weather && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/70 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                {weather.status === 'CLOUDBURST' || weather.status === 'HEAVY_RAIN' ? (
                  <CloudRain className="w-4 h-4 text-blue-400 animate-bounce" />
                ) : weather.status === 'SEVERE_HEAT' || weather.status === 'HEATWAVE' ? (
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <span>{weather.temperatureC}°C</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">
                Apparent: <span className="font-semibold text-slate-100">{weather.apparentTempC}°C</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">
                Rain:{' '}
                <span className={`font-semibold ${weather.precipitationRateMmHr > 20 ? 'text-blue-400' : 'text-slate-100'}`}>
                  {weather.precipitationRateMmHr} mm/h
                </span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">
                Hum: <span className="font-semibold text-slate-100">{weather.relativeHumidityPct}%</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                {weather.source}
              </span>
            </div>
          )}

          {/* Quick Refresh Live Weather */}
          <button
            onClick={onRefreshLive}
            disabled={isRefreshing}
            title="Poll real-time Open-Meteo weather API"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Live Sync</span>
          </button>
        </div>

        {/* Resilience Index & Action Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* City Resilience Score Meter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Resilience Index
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-sm font-extrabold ${
                    resilienceScore >= 70
                      ? 'text-emerald-400'
                      : resilienceScore >= 45
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {resilienceScore}%
                </span>
                <span className="text-[10px] text-slate-400">
                  {resilienceScore >= 70 ? 'STABLE' : resilienceScore >= 45 ? 'ELEVATED' : 'CRITICAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Alert Counter Badge */}
          <button
            onClick={() => onSelectTab('alerts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
              criticalCount > 0
                ? 'bg-red-950/60 border-red-600/70 text-red-300 shadow-md shadow-red-950/50 hover:bg-red-900/60'
                : activeAlerts > 0
                ? 'bg-amber-950/50 border-amber-600/60 text-amber-300 hover:bg-amber-900/50'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-400 animate-bounce' : 'text-amber-400'}`} />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wider">Active Alerts</div>
              <div className="text-xs font-black">
                {activeAlerts} {criticalCount > 0 && <span className="text-red-400">({criticalCount} Critical)</span>}
              </div>
            </div>
          </button>

          {/* Add Asset Context Button */}
          <button
            onClick={onOpenNewAsset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/40 border border-cyan-400/40 transition hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Asset</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
        <button
          onClick={() => onSelectTab('map')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            activeTab === 'map'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Operations Map & GIS
        </button>
        <button
          onClick={() => onSelectTab('assets')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            activeTab === 'assets'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Asset Vulnerability Register
        </button>
        <button
          onClick={() => onSelectTab('alerts')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
            activeTab === 'alerts'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span>Response Playbooks & SOPs</span>
          {activeAlerts > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
              {activeAlerts}
            </span>
          )}
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            activeTab === 'analytics'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Resilience Analytics
        </button>
      </div>
    </header>
  );
};
