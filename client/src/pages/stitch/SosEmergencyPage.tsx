import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { Mock } from '../../components/stitch/Mock';

type ServiceId = 'medical' | 'fire' | 'flood' | 'hazard';

interface ServiceOption {
  id: ServiceId;
  title: string;
  subtitle: string;
  icon: string;
  colorClass: string;
}

const SERVICES: ServiceOption[] = [
  {
    id: 'medical',
    title: 'Medical',
    subtitle: 'Paramedic & Trauma',
    icon: 'emergency',
    colorClass: 'bg-error-container text-on-error-container',
  },
  {
    id: 'fire',
    title: 'Fire & Rescue',
    subtitle: 'Structure / Wildfire',
    icon: 'local_fire_department',
    colorClass: 'bg-surface-container text-on-surface',
  },
  {
    id: 'flood',
    title: 'Flood / Boat',
    subtitle: 'Stranded Water Rescue',
    icon: 'kayaking',
    colorClass: 'bg-surface-container-highest text-secondary',
  },
  {
    id: 'hazard',
    title: 'Hazard Triage',
    subtitle: 'Power / Gas Leak',
    icon: 'bolt',
    colorClass: 'bg-surface-container text-on-surface',
  },
];

const TACTICAL_TAGS = [
  { id: 'water', label: 'Rising water level', icon: 'water_damage' },
  { id: 'trapped', label: 'Trapped indoors', icon: 'person_alert' },
  { id: 'mobility', label: 'Elderly / Mobility impaired', icon: 'accessible' },
  { id: 'children', label: 'Children present', icon: 'child_care' },
];

export const SosEmergencyPage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedServices, setSelectedServices] = useState<ServiceId[]>(['flood']);
  const [selectedTags, setSelectedTags] = useState<string[]>(['water']);

  // SOS Countdown state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [isDispatched, setIsDispatched] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleService = (id: ServiceId) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTriggerSos = () => {
    if (isDispatched) return;

    if (isCountingDown) {
      // Abort
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsCountingDown(false);
      setCountdownSeconds(3);
      return;
    }

    setIsCountingDown(true);
    setCountdownSeconds(3);

    timerRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setIsCountingDown(false);
          setIsDispatched(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header with Back Button */}
      <Header
        title="Emergency"
        subtitle="ClimateShield Citizen"
        hasBack={true}
        onBack={() => navigate('/citizen/map')}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full pb-space-2xl">
          {/* Top Location & Dispatch Header Panel */}
          <div className="px-edge-margin-mobile pt-space-xs pb-space-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                <span className="font-label-sm text-label-sm text-error uppercase font-bold tracking-wider">
                  Priority Distress Channel
                </span>
              </div>
              <div className="flex items-center gap-space-2xs px-space-xs py-1 rounded-full bg-surface-container-high text-on-surface-variant shadow-sm">
                <span className="material-symbols-outlined text-[14px] text-secondary">satellite_alt</span>
                <span className="font-label-sm text-label-sm font-semibold">Galileo/GPS Sync</span>
              </div>
            </div>

            {/* Active Precision Geolocation Pill */}
            <div className="w-full bg-surface-container-lowest rounded-xl p-space-sm shadow-md flex items-start gap-space-xs">
              <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-space-2xs flex-wrap">
                  <span className="font-title-lg text-title-lg text-on-surface font-bold">
                    <Mock label="Location">Downtown Waterfront</Mock>
                  </span>
                  <span className="font-code-sm text-code-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">
                    ±4m
                  </span>
                </div>
                <p className="font-code-sm text-code-sm text-on-surface-variant truncate mt-0.5">
                  <Mock label="Coordinates">37.7749° N, 122.4194° W</Mock>
                </p>
              </div>
              <button
                className="shrink-0 p-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors"
                title="Refresh Signal"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
              </button>
            </div>
          </div>

          {/* Mesh Network Status Strip */}
          <div className="px-edge-margin-mobile mb-space-sm">
            <div className="w-full bg-surface-container-lowest rounded-xl px-space-md py-2.5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-container"></span>
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Resilience Mesh Network: Active
                </span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-bold">
                P2P Ready
              </span>
            </div>
          </div>

          {/* Dispatch Classification 2x2 Tactical Selector */}
          <div className="px-edge-margin-mobile flex flex-col gap-space-2xs mb-space-md">
            <div className="flex items-center justify-between px-space-2xs mb-1">
              <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                Select Primary Threat
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Tap to toggle</span>
            </div>

            <div className="grid grid-cols-2 gap-space-xs" id="dispatch-grid">
              {SERVICES.map((serv) => {
                const isSelected = selectedServices.includes(serv.id);
                return (
                  <button
                    key={serv.id}
                    className={`service-card group text-left p-space-md rounded-xl shadow-md transition-all duration-150 flex flex-col justify-between relative overflow-hidden ${
                      isSelected ? 'bg-surface-container-high' : 'bg-surface-container-lowest'
                    }`}
                    data-selected={isSelected ? 'true' : 'false'}
                    onClick={() => toggleService(serv.id)}
                    type="button"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-space-sm transition-transform group-active:scale-95 ${serv.colorClass}`}
                    >
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {serv.icon}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-title-lg text-title-lg font-bold text-on-surface leading-tight">
                        {serv.title}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                        {serv.subtitle}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="selection-check absolute top-3 right-3 w-5 h-5 rounded-full bg-error text-on-error flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rapid Situational Note Pills */}
          <div className="px-edge-margin-mobile flex flex-col gap-space-xs mb-space-md">
            <div className="flex items-center justify-between px-space-2xs">
              <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                Tactical Tags
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Tap multi-select</span>
            </div>
            <div className="flex flex-wrap gap-space-xs" id="tactical-tags">
              {TACTICAL_TAGS.map((tag) => {
                const isActive = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    className={`tag-btn px-space-sm py-2 rounded-lg font-body-sm text-body-sm font-semibold shadow-sm flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-surface-container-high text-error'
                        : 'bg-surface-container-lowest text-on-surface'
                    }`}
                    data-active={isActive ? 'true' : 'false'}
                    onClick={() => toggleTag(tag.id)}
                    type="button"
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        isActive ? 'text-error' : 'text-on-surface-variant'
                      }`}
                    >
                      {tag.icon}
                    </span>
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Satellite Imagery Visual Verification */}
          <div className="px-edge-margin-mobile mb-space-md">
            <div className="w-full bg-surface-container-lowest rounded-xl p-space-sm shadow-md flex items-center gap-space-sm">
              <img
                className="w-16 h-16 rounded-lg object-cover shrink-0"
                alt="Satellite thermal aerial imagery of urban harbor flooded with water rescue coordinates overlay in high clarity"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOl0bY7-w_K8vfOxIsIAUoxvWEkIxbs4U9yRrrmaoNXgEo7dUarVeHUcfh1qSpWxH_JzbGdPb09g8oH79x1tdllsSYWpURRfNQG1LLXFf59visaGaDTFna_aX4-BumOYG6FiS8eapXNf1sk0cLXLr8d5s_FfM4BAZ5Ul06HP0cVu9tBsTkNZawuP35H33oej8damzbInTzaIaxx7RnPfc5IFI-yaYqzJpdWLBmlh7eT7jeA8jJOxlY"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface tracking-wider">
                    Sector Micro-Telemetry
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                  <Mock label="Sector Scan">
                    Automated visual sector scan active. Water level sensor +1.4m surge in Harbor District 04.
                  </Mock>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Trigger Confirmation HUD */}
          <div className="px-edge-margin-mobile flex flex-col gap-space-xs mt-auto">
            {/* Secondary Soft Cancel Trigger */}
            <button
              className="w-full h-11 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md font-semibold hover:bg-surface-container shadow-sm flex items-center justify-center transition-colors"
              onClick={() => navigate(-1)}
              type="button"
            >
              Cancel Emergency SOS
            </button>

            {/* Exactly ONE Primary Operational Solid Red Button */}
            <div className="relative w-full">
              <button
                className="w-full h-14 rounded-xl bg-error text-on-error font-title-lg text-title-lg font-bold shadow-lg flex items-center justify-center gap-space-xs transition-all active:scale-[0.98] overflow-hidden relative"
                id="sos-trigger-btn"
                onClick={handleTriggerSos}
                type="button"
              >
                <span className="material-symbols-outlined text-[26px]" id="sos-icon">
                  {isDispatched ? 'check_circle' : isCountingDown ? 'timer' : 'sos'}
                </span>
                <span id="sos-label">
                  {isDispatched
                    ? 'SOS Dispatched • Units Alerted'
                    : isCountingDown
                    ? `Dispatching SOS in ${countdownSeconds}s (Tap to Abort)`
                    : 'Send Emergency SOS'}
                </span>
                {/* Progress Bar for confirmation */}
                <div
                  className="absolute bottom-0 left-0 h-1 bg-surface-container-lowest transition-all duration-1000 ease-linear"
                  id="sos-progress"
                  style={{
                    width: isDispatched
                      ? '100%'
                      : isCountingDown
                      ? `${(4 - countdownSeconds) * 33}%`
                      : '0%',
                  }}
                ></div>
              </button>
            </div>

            <div className="text-center py-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Automatic distress beacon dispatch occurs after a 3-second fail-safe confirmation.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
