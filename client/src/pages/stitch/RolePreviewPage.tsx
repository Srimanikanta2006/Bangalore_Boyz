import React, { useState } from 'react';
import { ShieldMark } from '../../components/brand/ShieldMark';
import { WeatherReading, CitySummaryStats } from '../../types';

export type AppPersona = 'citizen' | 'rescue' | 'government' | 'console';

interface RolePreviewPageProps {
  onSelectPersona: (persona: AppPersona) => void;
  weather: WeatherReading | null;
  stats: CitySummaryStats | null;
}

export const RolePreviewPage: React.FC<RolePreviewPageProps> = ({
  onSelectPersona,
  weather,
  stats,
}) => {
  const [selectedRole, setSelectedRole] = useState<AppPersona>('citizen');
  const [email, setEmail] = useState('citizen.active@climateshield.org');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleSelect = (role: AppPersona, defaultEmail: string) => {
    setSelectedRole(role);
    setEmail(defaultEmail);
  };

  const handleLaunch = () => {
    onSelectPersona(selectedRole);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 font-body">
      {/* Top Floating App Bar */}
      <header className="w-full max-w-2xl flex items-center justify-between mb-8 px-4 py-3 rounded-2xl bg-surface-container-lowest shadow-swiss-ambient border border-outline-variant/30">
        <div className="flex items-center gap-3">
          <ShieldMark size={36} />
          <div>
            <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-on-surface-variant block">
              CLIMATESHIELD OS 4.2
            </span>
            <h1 className="font-heading font-bold text-base text-on-surface leading-tight">
              Urban Climate Resilience
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {weather && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-mono text-on-surface">
              <span className="text-secondary font-semibold">{weather.temperatureC}°C</span>
              <span className="text-outline-variant">|</span>
              <span className="text-hazard-flood font-medium">{weather.precipitationRateMmHr}mm/h</span>
            </div>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* Brand Banner */}
        <div className="text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center p-3 mb-3 shadow-swiss-ambient border border-outline-variant/30">
            <ShieldMark size={56} glow />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-secondary font-bold mb-1">
            Autonomous Incident & Risk Matrix
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
            ClimateShield
          </h2>
          <p className="font-body text-sm text-on-surface-variant max-w-md mt-1 leading-relaxed">
            Precision Climate Risk, Emergency Mobility & Urban Command Platform
          </p>
        </div>

        {/* Operational Sign In Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-swiss-ambient border border-outline-variant/40 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <span className="font-heading font-semibold text-sm text-on-surface">
              Field & Command Authentication
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-secondary font-medium">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              TLS 1.3 Active
            </span>
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="font-heading text-xs uppercase tracking-wider font-semibold text-on-surface-variant" htmlFor="auth-email">
              Authorized ID / Profile
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant select-none">
                badge
              </span>
              <input
                id="auth-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low text-on-surface text-sm font-medium border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                placeholder="officer@agency.gov or citizen@domain.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-heading text-xs uppercase tracking-wider font-semibold text-on-surface-variant" htmlFor="auth-pass">
                Operational Passcode
              </label>
              <span className="text-[11px] text-secondary font-medium cursor-pointer hover:underline">
                Demo Mode: Bypass Active
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant select-none">
                key
              </span>
              <input
                id="auth-pass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-low text-on-surface text-sm font-mono border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Instant Role Preview Selector */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
              <h3 className="font-heading font-bold text-base text-on-surface">
                Instant Role Profiles
              </h3>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container font-semibold text-on-surface-variant">
              SELECT TO LAUNCH
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Citizen Persona */}
            <div
              onClick={() => handleRoleSelect('citizen', 'citizen.active@climateshield.org')}
              className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-start gap-3.5 ${
                selectedRole === 'citizen'
                  ? 'bg-surface-container-lowest border-secondary shadow-swiss-ambient ring-2 ring-secondary/20'
                  : 'bg-surface-container-low/70 border-outline-variant/30 hover:bg-surface-container-lowest hover:border-outline-variant/60'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'citizen'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">explore</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-on-surface">
                    Citizen & Traveller
                  </h4>
                  {selectedRole === 'citizen' && (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-secondary-container text-white font-semibold">
                      Selected
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-secondary font-semibold block mt-0.5">
                  Safe Mobility & Public SOS
                </span>
                <p className="font-body text-xs text-on-surface-variant mt-1 leading-normal">
                  Live flood maps, dynamic safe routing with hazard avoidance, emergency shelter statuses, and one-tap SOS.
                </p>
              </div>
            </div>

            {/* Rescue Persona */}
            <div
              onClick={() => handleRoleSelect('rescue', 'captain.suresh@kdrf.gov.in')}
              className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-start gap-3.5 ${
                selectedRole === 'rescue'
                  ? 'bg-surface-container-lowest border-secondary shadow-swiss-ambient ring-2 ring-secondary/20'
                  : 'bg-surface-container-low/70 border-outline-variant/30 hover:bg-surface-container-lowest hover:border-outline-variant/60'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'rescue'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">emergency</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-on-surface">
                    Rescue & First Responder
                  </h4>
                  {selectedRole === 'rescue' && (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-secondary-container text-white font-semibold">
                      Selected
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-secondary font-semibold block mt-0.5">
                  Tactical Navigation & Field Triage
                </span>
                <p className="font-body text-xs text-on-surface-variant mt-1 leading-normal">
                  Assigned mission dossiers, turn-by-turn flood navigation, live field status reporting, and supervisor escalation.
                </p>
              </div>
            </div>

            {/* Government Persona */}
            <div
              onClick={() => handleRoleSelect('government', 'commissioner@bbmp.gov.in')}
              className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-start gap-3.5 ${
                selectedRole === 'government'
                  ? 'bg-surface-container-lowest border-secondary shadow-swiss-ambient ring-2 ring-secondary/20'
                  : 'bg-surface-container-low/70 border-outline-variant/30 hover:bg-surface-container-lowest hover:border-outline-variant/60'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'government'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">domain</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-on-surface">
                    Government Command Operations
                  </h4>
                  {selectedRole === 'government' && (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-secondary-container text-white font-semibold">
                      Selected
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-secondary font-semibold block mt-0.5">
                  Command Center & Disaster Simulator
                </span>
                <p className="font-body text-xs text-on-surface-variant mt-1 leading-normal">
                  City-wide GIS digital twin, cascade infrastructure impact simulator, critical asset monitoring, and emergency SOP dispatch.
                </p>
              </div>
            </div>

            {/* Operations Console */}
            <div
              onClick={() => handleRoleSelect('console', 'admin.analyst@climateshield.org')}
              className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-start gap-3.5 ${
                selectedRole === 'console'
                  ? 'bg-surface-container-lowest border-secondary shadow-swiss-ambient ring-2 ring-secondary/20'
                  : 'bg-surface-container-low/70 border-outline-variant/30 hover:bg-surface-container-lowest hover:border-outline-variant/60'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'console'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">grid_view</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-on-surface">
                    Full Operations Suite
                  </h4>
                  {selectedRole === 'console' && (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-primary text-white font-semibold">
                      Selected
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-on-surface-variant font-semibold block mt-0.5">
                  10 Deep Analytics & Management Pages
                </span>
                <p className="font-body text-xs text-on-surface-variant mt-1 leading-normal">
                  Direct access to Flagship Risk Map, Analytics, Historical Repeat Locations, Asset Manager, Team Directory, and System Settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Launch Action */}
        <button
          type="button"
          onClick={handleLaunch}
          className="w-full h-12 rounded-xl bg-primary text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-swiss-ambient hover:bg-slate-800 active:scale-[0.99] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
          <span>Launch Selected Experience ({selectedRole.toUpperCase()})</span>
        </button>

        {/* Footer City Summary Telemetry */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-container-low text-center border border-outline-variant/20">
            <div>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Critical Risks</span>
              <span className="font-mono font-bold text-base text-severity-critical">{stats.criticalRisks}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Active Incidents</span>
              <span className="font-mono font-bold text-base text-severity-high">{stats.activeIncidents}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Total Monitored</span>
              <span className="font-mono font-bold text-base text-secondary">{stats.totalAssets} Assets</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePreviewPage;
