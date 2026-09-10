import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Bell,
  User,
  Building2,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Clock,
  Sparkles,
  Database,
} from 'lucide-react';
import { WeatherReading, DataQualityStatus, SimulationScenario } from '../../types';

interface TopNavProps {
  weather: WeatherReading | null;
  dataQuality: DataQualityStatus | null;
  activeAlertsCount: number;
  onNavigate: (route: string) => void;
  onRefreshLive: () => void;
  onToggleStale: () => void;
  onApplyScenario: (scenarioId: string) => void;
  scenarios: SimulationScenario[];
  activeScenarioId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isRefreshing: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  weather,
  dataQuality,
  activeAlertsCount,
  onNavigate,
  onRefreshLive,
  onToggleStale,
  onApplyScenario,
  scenarios,
  activeScenarioId,
  searchQuery,
  onSearchChange,
  isRefreshing,
}) => {
  const [selectedOrg, setSelectedOrg] = useState('Bengaluru Urban District Command');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isScenarioDropdownOpen, setIsScenarioDropdownOpen] = useState(false);

  const orgs = [
    'Bengaluru Urban District Command',
    'Swarnandhra Campus Resilience Center',
    'Whitefield Infrastructure Authority',
  ];

  const isStale = dataQuality?.status === 'STALE';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Organization Selector */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="p-1.5 rounded-lg bg-sky-900 text-white shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  ClimateShield
                </span>
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Operations Center
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Demo Environment
                </span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden md:block" />

          {/* Org Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[200px]">{selectedOrg}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isOrgDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                {orgs.map((org) => (
                  <button
                    key={org}
                    onClick={() => {
                      setSelectedOrg(org);
                      setIsOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      selectedOrg === org ? 'font-semibold text-sky-700 bg-sky-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{org}</span>
                    {selectedOrg === org && <span className="text-sky-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md hidden lg:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search assets, zones, incidents, or hazard alerts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition"
            />
          </div>
        </div>

        {/* Right: Environmental Freshness, Scenario Menu, Notifications & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Data Freshness Indicator & Stale Toggle */}
          <div className="flex items-center gap-1.5">
            <div
              title={dataQuality?.message || 'Data stream status'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                isStale
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isStale ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`}
              />
              <span className="font-medium text-[11px]">
                {isStale ? 'Data: STALE (28m ago)' : 'Data: GOOD (2m ago)'}
              </span>
            </div>

            <button
              onClick={onToggleStale}
              title="Toggle simulated stale data to test how the platform handles data uncertainty"
              className="hidden sm:inline-block px-2 py-1 text-[10px] font-semibold rounded border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            >
              {isStale ? 'Restore Live Feed' : 'Simulate Delay'}
            </button>
          </div>

          {/* Quick Simulation Scenario Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsScenarioDropdownOpen(!isScenarioDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Scenario:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[90px]">
                {scenarios.find((s) => s.id === activeScenarioId)?.name.split(' ')[0] || 'Baseline'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isScenarioDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Hazard Stress-Test Scenarios
                </div>
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onApplyScenario(s.id);
                      setIsScenarioDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      activeScenarioId === s.id ? 'font-semibold text-sky-700 bg-sky-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{s.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => onNavigate('alerts')}
            title="View active alerts"
            className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
              VK
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                Vijay K.
              </div>
              <div className="text-[10px] text-slate-500 leading-none">
                Chief Dispatcher
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
