import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { BottomNav } from '../../components/stitch/BottomNav';
import { SosFab } from '../../components/stitch/SosFab';
import { useCitizenAlerts } from '../../citizen/useCitizenAlerts';
import type { AlertCategory, CitizenAlert, Severity } from '../../citizen/api';
import { getActiveRegion } from '../../citizen/geo';

const CATEGORY_META: Record<AlertCategory, { label: string; color: string }> = {
  FLOOD: { label: 'Flood', color: '#06B6D4' },
  HEAT: { label: 'Heat', color: '#D97706' },
  STORM: { label: 'Storm', color: '#0051d5' },
  WEATHER: { label: 'Weather', color: '#0090a9' },
  CORRIDOR: { label: 'Corridor', color: '#16A34A' },
};

function severityStyle(sev: Severity) {
  if (sev === 'HIGH' || sev === 'CRITICAL') {
    return { bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', dot: 'bg-[#EA580C]', bar: 'bg-[#EA580C]', accent: 'text-[#EA580C] hover:text-[#C2410C]', animate: true };
  }
  if (sev === 'MODERATE') {
    return { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', dot: 'bg-[#D97706]', bar: 'bg-[#D97706]', accent: 'text-[#B45309] hover:text-[#D97706]', animate: false };
  }
  return { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', bar: 'bg-[#16A34A]', accent: 'text-secondary hover:text-secondary-container', animate: false };
}

function actionFor(category: AlertCategory): { text: string; route: string } {
  if (category === 'FLOOD' || category === 'CORRIDOR') return { text: 'View safe detour route', route: '/citizen/routes' };
  if (category === 'HEAT') return { text: 'Locate cooling center', route: '/citizen/map' };
  return { text: 'View live map', route: '/citizen/map' };
}

function updatedLabel(minutes: number | null): string {
  if (minutes == null) return 'just now';
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return `${h}h ago`;
}

export const AlertsFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'high' | 'weather' | 'corridors'>('all');

  const activeRegion = getActiveRegion();
  const { data, loading, error, refetch } = useCitizenAlerts(5);

  const nepalAlerts: CitizenAlert[] = [
    {
      id: 'ktm_alert_1',
      category: 'FLOOD',
      severity: 'CRITICAL',
      title: 'Bagmati River Severe Flash Flood Inundation',
      description: 'Water levels raised 2.1m. Kathmandu valley low-lying corridors are blocked. Evacuate to Pashupati High-Ground Relief Shelter.',
      source: 'Department of Hydrology & Meteorology, Nepal',
      dataQuality: 'LIVE_OBSERVED',
      issuedAt: new Date().toISOString(),
      freshnessMinutes: 2,
      tags: ['high', 'weather', 'corridors'],
    },
    {
      id: 'ktm_alert_2',
      category: 'STORM',
      severity: 'HIGH',
      title: 'Heavy Torrential Rainfall Warning — Kathmandu Valley',
      description: 'Monsoon flash runoff affecting Balkhu & Ring Road interchanges. Safe ridge detour routes actively computed.',
      source: 'Kathmandu Flood Control Center',
      dataQuality: 'LIVE_OBSERVED',
      issuedAt: new Date().toISOString(),
      freshnessMinutes: 8,
      tags: ['high', 'weather'],
    },
  ];

  const baseAlerts: CitizenAlert[] = data?.alerts ?? [];
  const allAlerts: CitizenAlert[] = activeRegion === 'NEPAL' ? [...nepalAlerts, ...baseAlerts] : baseAlerts;

  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allAlerts.filter((item) => {
      const textMatch =
        query === '' ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      const filterMatch = currentFilter === 'all' || item.tags.includes(currentFilter);
      return textMatch && filterMatch;
    });
  }, [searchQuery, currentFilter, allAlerts]);

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header */}
      <Header title="Alerts" subtitle="ClimateShield Citizen" />

      {/* Main Alerts Feed */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full">
          {/* Search & Filter Bar */}
          <div className="px-edge-margin-mobile pt-space-xs pb-space-sm">
            <div className="relative w-full mb-space-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                className="w-full h-10 pl-9 pr-8 bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:bg-surface-container-low transition-colors duration-150"
                id="alert-search-input"
                placeholder="Search alerts or neighborhood..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
                  id="clear-search-btn"
                  type="button"
                  onClick={() => setSearchQuery('')}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-space-2xs overflow-x-auto no-scrollbar py-0.5" id="filter-chips">
              <button
                className={`filter-chip shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 ${
                  currentFilter === 'all'
                    ? 'bg-primary-container text-on-primary active'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                data-filter="all"
                type="button"
                onClick={() => setCurrentFilter('all')}
              >
                <span>All Alerts</span>
                <span className="bg-surface-container-lowest/20 text-on-primary px-1.5 py-0.2 rounded-full font-label-sm text-[10px]">
                  {allAlerts.length}
                </span>
              </button>

              <button
                className={`filter-chip shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 ${
                  currentFilter === 'high'
                    ? 'bg-primary-container text-on-primary active'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                data-filter="high"
                type="button"
                onClick={() => setCurrentFilter('high')}
              >
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span>High Severity</span>
              </button>

              <button
                className={`filter-chip shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 ${
                  currentFilter === 'weather'
                    ? 'bg-primary-container text-on-primary active'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                data-filter="weather"
                type="button"
                onClick={() => setCurrentFilter('weather')}
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">cloud</span>
                <span>Weather</span>
              </button>

              <button
                className={`filter-chip shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-1.5 ${
                  currentFilter === 'corridors'
                    ? 'bg-primary-container text-on-primary active'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
                data-filter="corridors"
                type="button"
                onClick={() => setCurrentFilter('corridors')}
              >
                <span className="material-symbols-outlined text-[15px] text-secondary-container">alt_route</span>
                <span>Safe Corridors</span>
              </button>
            </div>
          </div>

          {/* Feed Header */}
          <div className="px-edge-margin-mobile flex items-center justify-between pb-space-xs text-on-surface-variant">
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Active Citizen Advisories
            </span>
            <button
              type="button"
              onClick={refetch}
              className="font-label-sm text-label-sm flex items-center gap-1 text-secondary font-medium hover:text-secondary-container transition-colors"
            >
              <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>sync</span>
              <span>{loading ? 'Syncing…' : 'Refresh'}</span>
            </button>
          </div>

          {/* Error banner */}
          {error && !loading && (
            <div className="px-edge-margin-mobile pb-space-xs">
              <div role="alert" className="flex items-center justify-between gap-2 rounded-lg bg-error-container/60 text-on-error-container px-3 py-2">
                <span className="font-body-sm text-body-sm">Couldn’t load live alerts.</span>
                <button type="button" onClick={refetch} className="font-label-sm text-label-sm font-bold underline">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Alerts Card List */}
          <div className="px-edge-margin-mobile flex flex-col gap-space-sm" id="alerts-container">
            {filteredAlerts.map((alert) => {
              const s = severityStyle(alert.severity);
              const cat = CATEGORY_META[alert.category];
              const action = actionFor(alert.category);
              return (
              <article
                key={alert.id}
                className="relative overflow-hidden bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] transition-transform duration-150 active:scale-[0.99]"
                data-card={alert.tags.join(' ')}
              >
                {/* Left Edge Severity Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.bar}`}></div>

                <div className="pl-4 pr-space-md py-space-md flex flex-col gap-space-xs">
                  {/* Top Row: Hazard Pill + Severity Badge + Timestamp */}
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm font-bold text-on-surface">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                        {cat.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${s.bg} ${s.text} font-label-sm text-label-sm font-bold`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.animate ? 'animate-ping' : ''}`}></span>
                        {alert.severity}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide"
                        title="Data provenance"
                      >
                        {alert.dataQuality}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline tabular-nums flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      Updated {updatedLabel(alert.freshnessMinutes)}
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="mt-0.5">
                    <h2 className="font-title-lg text-title-lg text-on-surface font-bold leading-snug">
                      {alert.title}
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>

                  {/* Action Link & Share */}
                  <div className="pt-1 mt-0.5 flex items-center justify-between">
                    <button
                      className={`group inline-flex items-center gap-1.5 font-label-md text-label-md font-bold ${s.accent} transition-colors duration-150`}
                      type="button"
                      onClick={() => navigate(action.route)}
                    >
                      <span>{action.text}</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform duration-150">
                        arrow_forward
                      </span>
                    </button>
                    <span className="inline-flex items-center text-outline-variant hover:text-on-surface-variant p-1 cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">share</span>
                    </span>
                  </div>
                </div>
              </article>
              );
            })}

            {/* Loading skeleton (first load) */}
            {loading && allAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] animate-spin mb-2">progress_activity</span>
                <p className="font-body-sm text-body-sm">Loading live advisories…</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredAlerts.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-container-lowest rounded-xl shadow-sm"
                id="no-alerts-state"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-2">
                  <span className="material-symbols-outlined text-[24px]">notifications_paused</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">No Active Alerts</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  No alerts match your current filter criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating SOS FAB */}
      <SosFab />

      {/* Persistent Bottom Nav */}
      <BottomNav activeTab="alerts" />
    </div>
  );
};
