import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { BottomNav } from '../../components/stitch/BottomNav';
import { SosFab } from '../../components/stitch/SosFab';
import { Mock } from '../../components/stitch/Mock';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api';

type RoleType = 'citizen' | 'government' | 'gov-field' | 'rescue';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleType>('citizen');
  const [email, setEmail] = useState('citizen@climateshield.demo');
  const [password, setPassword] = useState('DemoGov@2024');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-login landing route per UI role card. 'gov-field' and 'rescue' both
  // authenticate as the SAME backend role (FIELD_OPERATOR) - there is no
  // separate RESCUE role - so the destination is chosen by which card the
  // user picked here, not solely by the server-returned role.
  const roleTargets: Record<RoleType, string> = {
    citizen: '/citizen/map',
    government: '/gov/overview',
    'gov-field': '/gov/mobile/map',
    rescue: '/rescue/tactical',
  };

  const roleConfigs: Record<RoleType, { label: string; icon: string; demoEmail: string }> = {
    citizen: {
      label: 'Launch Citizen Experience',
      icon: 'shield',
      demoEmail: 'citizen@climateshield.demo',
    },
    government: {
      label: 'Enter Government HQ Console',
      icon: 'dashboard',
      demoEmail: 'government@climateshield.demo',
    },
    'gov-field': {
      label: 'Enter Government Mobile Field',
      icon: 'near_me',
      demoEmail: 'field@climateshield.demo',
    },
    rescue: {
      label: 'Engage Tactical Rescue Mesh',
      icon: 'emergency_share',
      // Same demo account as gov-field: both are FIELD_OPERATOR accounts.
      demoEmail: 'field@climateshield.demo',
    },
  };

  // Selecting a role card prefills the matching demo account email & password.
  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
    setError(null);
    setEmail(roleConfigs[role].demoEmail);
    setPassword('DemoGov@2024');
  };

  const handleLaunch = async () => {
    if (submitting) return;
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password to sign in.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // Prefer the originally-requested location when it's within the chosen
      // role's own area, else land on that role card's target route.
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      const ownArea = selectedRole === 'citizen' ? '/citizen' : selectedRole === 'rescue' ? '/rescue' : '/gov';
      const target = from && from.startsWith(ownArea) ? from : roleTargets[selectedRole];
      navigate(target, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.code === 'INVALID_CREDENTIALS'
            ? 'Invalid email or password.'
            : err.message
          : 'Sign in failed. Please check your network and try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header */}
      <Header title="Authentication" subtitle="ClimateShield Platform" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full px-edge-margin-mobile pb-6 pt-2">
          {/* Brand & Identity Banner */}
          <div className="flex flex-col items-center text-center mt-space-xs mb-space-lg">
            <div className="w-20 h-16 rounded-xl bg-surface-container flex items-center justify-center p-2 mb-space-sm shadow-sm">
              <img
                alt="ClimateShield Shield Mark"
                className="w-full h-full object-contain rounded-lg"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WZa1gNvntWWeiT4QhM-l_fIhJeTNPgwhOocSm5zkFiyeUn3CdWKg2P6QBAp2739f4ineyLsZACoh0wcEewdNPLn7dJp1NR4H3lnvVimUYZHBtoiKTEcHeUelauAMp_CGDEiOGu2-Yqz4_Vqk5IejETJ6u1R9tsOCq5DwbAv411fFrUovtU623EzW2rGPgJX0iZQ2U-lv-rR-wRns1wPkTfcV5BBGcpGIRxWJQowEeXYjkRRS5BZt3IWUg"
              />
            </div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-bold mb-1">
              <Mock label="Release Version">Resilience System 4.2</Mock>
            </span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
              ClimateShield
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[270px] mt-1 leading-relaxed">
              Precision Climate Risk &amp; Emergency Mobility Platform
            </p>
          </div>

          {/* Operational Sign In Form Surface */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm mb-space-lg">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface font-semibold tracking-tight">
                Field Credentials
              </span>
              <span className="inline-flex items-center gap-1 font-code-sm text-code-sm text-secondary font-medium">
                <span className="material-symbols-outlined text-[14px]">lock</span> TLS Encrypted
              </span>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label
                className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold"
                htmlFor="email"
              >
                Authorized ID / Email
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant select-none">
                  badge
                </span>
                <input
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-highest transition-colors"
                  id="email"
                  placeholder="officer@agency.gov or user@domain.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold"
                  htmlFor="password"
                >
                  Password
                </label>
                <button className="font-label-sm text-label-sm text-secondary hover:underline" type="button">
                  Forgot?
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant select-none">
                  key
                </span>
                <input
                  className="w-full h-10 pl-9 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-highest transition-colors"
                  id="password"
                  placeholder="Enter operational passcode"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLaunch();
                  }}
                />
                <button
                  className="absolute right-3 text-on-surface-variant flex items-center justify-center p-1"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Inline error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-red-100 text-red-900 border border-red-300 p-3 font-body-sm text-body-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-red-700 mt-px shrink-0">error</span>
                <span className="flex-1 font-medium">{error}</span>
              </div>
            )}

            {/* Secondary Outline Action */}
            <button
              className="w-full h-10 mt-1 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md font-semibold flex items-center justify-center gap-1.5 active:bg-surface-container-high transition-colors disabled:opacity-60"
              type="button"
              onClick={handleLaunch}
              disabled={submitting}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>{submitting ? 'Signing In…' : 'Verify & Sign In'}</span>
            </button>

            {/* Demo credential hint (no auth bypass - every role signs in for real) */}
            <div className="flex items-center text-xs text-on-surface-variant px-1 mt-0.5">
              <span>Demo passcode: <code className="bg-surface-container-highest px-1.5 py-0.5 rounded font-mono text-[11px] font-bold text-on-surface">DemoGov@2024</code></span>
            </div>
          </div>

          {/* Role Selector Switch Section */}
          <div className="flex flex-col mb-space-lg">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold tracking-tight">
                  Instant Role Preview
                </h3>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-semibold">
                Tap Card
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant px-1 mb-3">
              Select a mission profile to explore real-time telemetry, routing, and command pipelines.
            </p>

            {/* Role Option Cards Stack */}
            <div className="flex flex-col gap-2" id="role-selector-group">
              {/* Role 1: Citizen */}
              <div
                className={`role-card relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all shadow-sm ${
                  selectedRole === 'citizen'
                    ? 'bg-surface-container-lowest'
                    : 'bg-surface-container opacity-90'
                }`}
                data-role="citizen"
                onClick={() => handleSelectRole('citizen')}
              >
                <div
                  className={`role-icon-box w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedRole === 'citizen'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-highest text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={selectedRole === 'citizen' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    explore
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-title-lg text-title-lg text-on-surface font-bold truncate">
                      Citizen / Traveller
                    </h4>
                    {selectedRole === 'citizen' && (
                      <span className="role-badge font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                  <span className="font-code-sm text-code-sm text-secondary block font-semibold mb-0.5">
                    Mobile Map-First Mode
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                    Dynamic evacuation corridors, live shelter occupancy status, and neighborhood air quality telemetry.
                  </p>
                </div>
              </div>

              {/* Role 2: Government Operations */}
              <div
                className={`role-card relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all shadow-sm ${
                  selectedRole === 'government'
                    ? 'bg-surface-container-lowest'
                    : 'bg-surface-container opacity-90'
                }`}
                data-role="government"
                onClick={() => handleSelectRole('government')}
              >
                <div
                  className={`role-icon-box w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedRole === 'government'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-highest text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={selectedRole === 'government' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    domain
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-title-lg text-title-lg text-on-surface font-bold truncate">
                      Government Operations
                    </h4>
                    {selectedRole === 'government' && (
                      <span className="role-badge font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant block font-semibold mb-0.5">
                    Desktop Command Center
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                    Municipal GIS layers, infrastructure vulnerability matrices, and public broadcast controls.
                  </p>
                </div>
              </div>

              {/* Role 3: Government Mobile / Field Operations */}
              <div
                className={`role-card relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all shadow-sm ${
                  selectedRole === 'gov-field'
                    ? 'bg-surface-container-lowest'
                    : 'bg-surface-container opacity-90'
                }`}
                data-role="gov-field"
                onClick={() => handleSelectRole('gov-field')}
              >
                <div
                  className={`role-icon-box w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedRole === 'gov-field'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-highest text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={selectedRole === 'gov-field' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    near_me
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-title-lg text-title-lg text-on-surface font-bold truncate">
                      Government Mobile / Field
                    </h4>
                    {selectedRole === 'gov-field' && (
                      <span className="role-badge font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant block font-semibold mb-0.5">
                    Field Triage &amp; Deployment
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                    Rapid mobile incident response, asset telemetry, flood barrier deployment, and DPW tasks.
                  </p>
                </div>
              </div>

              {/* Role 4: Rescue Team */}
              <div
                className={`role-card relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all shadow-sm ${
                  selectedRole === 'rescue'
                    ? 'bg-surface-container-lowest'
                    : 'bg-surface-container opacity-90'
                }`}
                data-role="rescue"
                onClick={() => handleSelectRole('rescue')}
              >
                <div
                  className={`role-icon-box w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedRole === 'rescue'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-highest text-on-surface'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={selectedRole === 'rescue' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    medical_services
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-title-lg text-title-lg text-on-surface font-bold truncate">
                      Rescue Team
                    </h4>
                    {selectedRole === 'rescue' && (
                      <span className="role-badge font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant block font-semibold mb-0.5">
                    Field Tactical Mesh
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                    Offline P2P hazard sync, SOS triage queues, asset deployment tracking, and route hazard tags.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Active Sector Pulse Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-lg flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-3 h-3 rounded-full bg-secondary-container animate-pulse shrink-0"></div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
                  Active Monitoring Grid
                </span>
                <span className="font-title-lg text-title-lg text-on-surface font-semibold truncate">
                  <Mock label="Sector Name">Metro Coastal Sector 04-A</Mock>
                </span>
              </div>
            </div>
            <span className="font-code-sm text-code-sm text-secondary font-bold px-2 py-1 rounded bg-surface-container-high shrink-0">
              <Mock label="Sync Rate">99.98% Synced</Mock>
            </span>
          </div>

          {/* Exactly ONE primary solid operational CTA button */}
          <div className="sticky bottom-0 bg-surface/90 backdrop-blur-md pt-2 pb-1">
            <button
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-body-md text-body-md font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] transition-transform disabled:opacity-60"
              id="primary-launch-btn"
              type="button"
              onClick={handleLaunch}
              disabled={submitting}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {roleConfigs[selectedRole].icon}
              </span>
              <span id="btn-label-text">{submitting ? 'Authenticating…' : roleConfigs[selectedRole].label}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <div className="flex justify-center items-center gap-4 mt-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">offline_bolt</span> Ready for Offline Fallback
              </span>
              <span className="text-on-surface-variant">•</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                <Mock label="Build Tag">Version 4.2.1-b</Mock>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Floating SOS FAB */}
      <SosFab />

      {/* Persistent Bottom Nav */}
      <BottomNav activeTab="profile" />
    </div>
  );
};
