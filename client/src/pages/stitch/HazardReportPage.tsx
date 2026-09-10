import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { resolveCoords, type GeoState } from '../../citizen/geo';
import { reverseGeocode } from '../../citizen/reverseGeocode';
import { submitCitizenReport, type CitizenReportCategory } from '../../citizen/api';
import { ApiError } from '../../lib/api';

type HazardKey =
  | 'flash-flood'
  | 'road-blocked'
  | 'power-line'
  | 'extreme-heat'
  | 'water-main'
  | 'landslide'
  | 'storm-damage'
  | 'other';

const HAZARD_TO_CATEGORY: Record<HazardKey, CitizenReportCategory> = {
  'flash-flood': 'FLASH_FLOOD',
  'road-blocked': 'ROAD_BLOCKED',
  'power-line': 'DOWNED_LINE',
  'extreme-heat': 'EXTREME_HEAT',
  'water-main': 'WATER_MAIN',
  landslide: 'LANDSLIDE_MUD',
  'storm-damage': 'STORM_DAMAGE',
  other: 'OTHER',
};

interface HazardOption {
  key: HazardKey;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
}

const HAZARD_OPTIONS: HazardOption[] = [
  {
    key: 'flash-flood',
    title: 'Flash Flood',
    subtitle: 'Standing/rapid water',
    icon: 'flood',
    iconColor: '#06B6D4',
  },
  {
    key: 'road-blocked',
    title: 'Road Blocked',
    subtitle: 'Impassable debris',
    icon: 'scan',
    iconColor: 'text-on-surface-variant',
  },
  {
    key: 'power-line',
    title: 'Downed Line',
    subtitle: 'Tree or wire hazard',
    icon: 'electric_bolt',
    iconColor: '#D97706',
  },
  {
    key: 'extreme-heat',
    title: 'Extreme Heat',
    subtitle: 'Thermal stress zone',
    icon: 'local_fire_department',
    iconColor: '#F97316',
  },
  {
    key: 'water-main',
    title: 'Water Main',
    subtitle: 'Pressurized rupture',
    icon: 'plumbing',
    iconColor: 'text-secondary',
  },
  {
    key: 'landslide',
    title: 'Landslide / Mud',
    subtitle: 'Slope instability',
    icon: 'landslide',
    iconColor: '#92400E',
  },
  {
    key: 'storm-damage',
    title: 'Storm Damage',
    subtitle: 'Structural/wind surge',
    icon: 'cyclone',
    iconColor: '#7C3AED',
  },
  {
    key: 'other',
    title: 'Other Hazard',
    subtitle: 'Unclassified anomaly',
    icon: 'emergency',
    iconColor: 'text-on-surface-variant',
  },
];

export const HazardReportPage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedHazard, setSelectedHazard] = useState<HazardKey>('flash-flood');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [coords, setCoords] = useState<GeoState | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      const geo = await resolveCoords();
      if (cancelled) return;
      setCoords(geo);
      setLocating(false);
      const addr = await reverseGeocode(geo.latitude, geo.longitude, controller.signal);
      if (!cancelled) setAddress(addr);
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoto(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async () => {
    if (!coords || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const report = await submitCitizenReport({
        category: HAZARD_TO_CATEGORY[selectedHazard],
        description: description.trim() || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
        files: photo ? [photo] : [],
      });
      setSubmittedCode(report.reportCode);
      setTimeout(() => navigate('/citizen/map'), 1800);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError && err.code === 'LOCATION_OUTSIDE_COVERAGE'
          ? 'Your location is outside the monitored coverage area.'
          : 'Failed to submit report. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      {/* Header with Back Button */}
      <Header
        title="Hazard Report"
        subtitle="ClimateShield Citizen"
        hasBack={true}
        onBack={() => navigate('/citizen/map')}
      />

      {/* Main Form Flow */}
      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full px-edge-margin-mobile pb-space-2xl">
          {/* Progress Tracker & Urgency Banner */}
          <div className="flex items-center justify-between py-space-sm">
            <div className="flex items-center gap-space-2xs">
              <span className="inline-flex w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                Field Triage Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code-sm text-code-sm">
              <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
              <span>{coords?.usingFallback ? 'GPS Unavailable (Demo Location)' : 'GPS Active'}</span>
            </div>
          </div>

          {/* Incident Verification Card / Location Anchor */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md">
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex items-start gap-space-xs">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">near_me</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-title-lg text-title-lg text-on-surface font-bold truncate">
                      {locating ? 'Locating…' : address ?? (coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Unknown')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-label-sm font-label-sm">
                      {coords?.usingFallback ? 'Demo Pin' : 'GPS Pinned'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hazard Selection Grid Header */}
          <div className="flex items-baseline justify-between mb-space-xs">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Classify Phenomenon</h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Step 1 of 3
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
            Select primary environmental threat observed at coordinates.
          </p>

          {/* 4x2 Hazard Matrix Grid */}
          <div
            aria-label="Hazard Type Selection"
            className="grid grid-cols-2 gap-space-xs mb-space-lg"
            id="hazardGrid"
            role="radiogroup"
          >
            {HAZARD_OPTIONS.map((opt) => {
              const isChecked = selectedHazard === opt.key;
              return (
                <button
                  key={opt.key}
                  aria-checked={isChecked}
                  className={`hazard-card group relative text-left p-space-sm rounded-xl transition-all duration-150 flex flex-col justify-between h-[96px] ${
                    isChecked
                      ? 'bg-surface-container-highest shadow-sm'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                  data-hazard={opt.key}
                  role="radio"
                  type="button"
                  onClick={() => setSelectedHazard(opt.key)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shadow-sm"
                      style={opt.iconColor.startsWith('#') ? { color: opt.iconColor } : undefined}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          !opt.iconColor.startsWith('#') ? opt.iconColor : ''
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {opt.icon}
                      </span>
                    </div>
                    {isChecked && (
                      <span className="check-pill flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-title-lg text-title-lg text-on-surface font-bold leading-tight truncate">
                      {opt.title}
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {opt.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Visual Evidence Attachment Slot */}
          <div className="flex items-baseline justify-between mb-space-xs">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Visual Telemetry</h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {photo ? '1 file attached' : '0 files attached'}
            </span>
          </div>

          <div className="flex flex-col gap-space-xs mb-space-lg">
            <div className="grid grid-cols-2 gap-space-xs">
              {/* Attached Preview Thumbnail */}
              {photo && photoPreviewUrl && (
                <div className="relative h-32 rounded-xl overflow-hidden shadow-sm bg-surface-container">
                  <img className="w-full h-full object-cover" alt="Attached hazard evidence" src={photoPreviewUrl} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-primary font-bold drop-shadow truncate">
                      {photo.name}
                    </span>
                    <button
                      aria-label="Remove photo"
                      className="w-6 h-6 rounded-full bg-inverse-surface/80 text-on-primary flex items-center justify-center hover:bg-error transition-colors shrink-0"
                      type="button"
                      onClick={() => setPhoto(null)}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Add Media Slot */}
              <label className="h-32 flex flex-col items-center justify-center p-space-sm rounded-xl bg-surface-container-lowest shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors text-center relative">
                <input
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="sr-only"
                  type="file"
                  onChange={handleFileChange}
                />
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-1.5">
                  <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                </div>
                <span className="font-title-lg text-title-lg text-on-surface font-bold text-xs">Attach Photo</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] mt-0.5">
                  jpg, png or webp · max 5MB
                </span>
              </label>
            </div>
          </div>

          {/* Incident Context Details */}
          <div className="flex items-baseline justify-between mb-space-xs">
            <label className="font-headline-md text-headline-md text-on-surface font-bold" htmlFor="hazardDescription">
              Field Notes &amp; Severity
            </label>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Optional
            </span>
          </div>

          <div className="relative bg-surface-container-lowest rounded-xl p-space-sm shadow-sm mb-space-lg">
            <textarea
              className="w-full bg-transparent resize-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
              id="hazardDescription"
              placeholder="Add context (e.g. water height above sidewalk, electrical arcing, impassable for passenger vehicles)..."
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center justify-end pt-space-xs mt-space-2xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {description.length} / 2000
              </span>
            </div>
          </div>

          {/* Submission error */}
          {submitError && (
            <div role="alert" className="mb-space-md rounded-xl bg-error-container/60 text-on-error-container px-space-sm py-space-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="font-body-sm text-body-sm">{submitError}</span>
            </div>
          )}

          {/* Sticky Bottom Operational CTA Container */}
          <div className="sticky bottom-0 w-full pt-space-xs pb-safe bg-surface/90 backdrop-blur-md mt-auto">
            <div className="p-space-xs bg-surface-container-lowest rounded-xl shadow-lg">
              <button
                className={`w-full h-12 rounded-lg font-body-md text-body-md font-bold flex items-center justify-center gap-space-xs transition-colors shadow-sm active:scale-[0.99] disabled:opacity-60 ${
                  submittedCode
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-primary hover:bg-[#1E293B] text-on-primary'
                }`}
                disabled={submitting || locating || !!submittedCode}
                id="submitReportBtn"
                type="button"
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Submitting…</span>
                  </>
                ) : submittedCode ? (
                  <>
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span>Report Submitted {submittedCode}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>Submit Hazard Report</span>
                  </>
                )}
              </button>
              {submittedCode && (
                <button
                  type="button"
                  onClick={() => navigate('/citizen/activity')}
                  className="w-full text-center font-label-md text-label-md text-secondary font-bold mt-1.5 underline"
                >
                  Track this report's status →
                </button>
              )}
              <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-1.5 pb-0.5">
                Creates a tracked incident for operator review (ClimateShield Ops Center)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
