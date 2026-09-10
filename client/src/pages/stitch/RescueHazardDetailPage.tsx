import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Shield, Radio, AlertTriangle, AlertOctagon,
  RefreshCw, CheckCircle2,
} from 'lucide-react';
import { fetchIncidentCascade } from '../../services/api';

interface CascadeNode {
  assetId: string;
  assetCode: string;
  name: string;
  type: string;
  criticality: string;
  operationalStatus: string;
  depth: number;
  impactType: string;
  impactScore: number;
  explanation: string;
}

interface CascadeData {
  incident: { id: string; incidentCode: string; title: string; severity: string; status: string; zoneName: string };
  hazard: { id: string; type: string; severity: string; rainfallRate: number | null; waterDepth: number | null; flowVelocity: number | null; temperature: number | null; windSpeed: number | null } | null;
  rootAsset: { id: string; name: string; assetCode: string; type: string; criticality: string; operationalStatus: string } | null;
  baseRisk: { score: number; level: string; confidence: number; explanation: string } | null;
  nodes: CascadeNode[];
  note?: string;
}

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-[#ffdad6] text-[#93000a]',
  HIGH: 'bg-[#ffedd5] text-[#c2410c]',
  MODERATE: 'bg-[#fef3c7] text-[#b45309]',
  LOW: 'bg-[#dcfce7] text-[#15803d]',
};

export const RescueHazardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const incidentId = id ?? '';

  const [data, setData] = useState<CascadeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) return;
    fetchIncidentCascade(incidentId)
      .then(setData)
      .catch((err) => setError((err as Error)?.message ?? 'Failed to load hazard/cascade detail.'))
      .finally(() => setLoading(false));
  }, [incidentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const severity = data?.incident.severity ?? 'MODERATE';
  const impactedAssets = (data?.nodes ?? []).filter((n) => n.depth > 0);

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-32">
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#e5eeff] shadow-sm">
        <div className="h-16 px-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-[#0b1c30] hover:text-[#0051d5] active:scale-95 transition-all rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight leading-none text-[#0b1c30]">Hazard / Cascade Detail</span>
            <span className="text-[11px] text-[#45464d] leading-none mt-0.5">
              {data?.incident.incidentCode ? `#${data.incident.incidentCode}` : incidentId}
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-col pt-20 flex-grow px-4 gap-3">
        {loading && (
          <div className="flex flex-col items-center py-16 gap-2 text-[#45464d]">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading real cascade data…</span>
          </div>
        )}
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{error}</div>}

        {!loading && data && (
          <>
            {/* Incident + hazard classification — real */}
            <div className="flex flex-col bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold uppercase">
                  <span className="w-2 h-2 rounded-sm bg-[#0090a9]" />
                  <span>{data.hazard?.type.replace(/_/g, ' ') ?? 'No active hazard'}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.MODERATE}`}>
                  {severity}
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#0b1c30]">{data.incident.title}</h2>
              <span className="text-xs text-[#45464d]">{data.incident.zoneName}</span>

              {data.baseRisk && (
                <div className="flex items-baseline justify-between mt-1">
                  <div>
                    <span className="text-[11px] uppercase text-[#45464d] tracking-wider font-semibold">Deterministic Risk Score</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-extrabold text-[#ba1a1a] leading-none">{data.baseRisk.score}</span>
                      <span className="text-sm text-[#45464d] font-normal">/ 100 ({data.baseRisk.level})</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#45464d] font-mono">Confidence {Math.round(data.baseRisk.confidence * 100)}%</span>
                </div>
              )}
              {data.baseRisk?.explanation && (
                <p className="text-xs text-[#45464d] leading-snug mt-1">{data.baseRisk.explanation}</p>
              )}
            </div>

            {/* Real measured hazard values (nulls shown honestly, never invented) */}
            {data.hazard && (
              <div className="grid grid-cols-2 gap-2">
                <HazardMetric label="Rainfall Rate" value={data.hazard.rainfallRate} unit="mm/hr" />
                <HazardMetric label="Water Depth" value={data.hazard.waterDepth} unit="m" />
                <HazardMetric label="Flow Velocity" value={data.hazard.flowVelocity} unit="m/s" />
                <HazardMetric label="Wind Speed" value={data.hazard.windSpeed} unit="km/h" />
              </div>
            )}

            {/* Root asset — real */}
            {data.rootAsset && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white shadow-sm border border-[#e5eeff]">
                <AlertOctagon className="w-6 h-6 text-[#ba1a1a] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-sm tracking-wide uppercase text-[#0b1c30]">Root Cause Asset</span>
                  <p className="text-sm text-[#0b1c30]">{data.rootAsset.name} ({data.rootAsset.assetCode})</p>
                  <p className="text-xs text-[#45464d]">{data.rootAsset.criticality} criticality · {data.rootAsset.operationalStatus}</p>
                </div>
              </div>
            )}

            {/* Downstream cascade — real, from the dependency-graph engine */}
            {impactedAssets.length > 0 && (
              <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e5eeff]">
                <h3 className="font-bold text-sm text-[#0b1c30] uppercase tracking-wide mb-2">Downstream Cascade Impact</h3>
                <div className="flex flex-col gap-2">
                  {impactedAssets.slice(0, 6).map((n) => (
                    <div key={n.assetId} className="flex items-center justify-between text-xs bg-[#eff4ff] rounded-lg p-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-[#0b1c30] block truncate">{n.name}</span>
                        <span className="text-[#45464d]">{n.impactType.replace(/_/g, ' ')} · depth {n.depth}</span>
                      </div>
                      <span className="font-mono font-bold text-[#ba1a1a] shrink-0">{n.impactScore}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.note && (
              <div className="rounded-xl bg-[#eff4ff] p-4 text-xs text-[#45464d]">{data.note}</div>
            )}

            {/* Field actions — local acknowledgment only (no dispatch endpoint exists for these yet) */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => showToast('Hazard flagged locally — notify Command via radio to confirm receipt.')}
                className="w-full h-11 px-4 rounded-xl bg-[#e5eeff] text-[#0b1c30] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#dce9ff] active:scale-[0.99] transition-all"
              >
                <Radio className="w-4 h-4 text-[#ba1a1a]" />
                <span>Flag Hazard Priority (Radio Command)</span>
              </button>
            </div>
          </>
        )}
      </main>

      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 border border-white/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

const HazardMetric: React.FC<{ label: string; value: number | null; unit: string }> = ({ label, value, unit }) => (
  <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-[#e5eeff]">
    <span className="text-[11px] uppercase font-semibold text-[#45464d]">{label}</span>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-2xl font-extrabold text-[#0b1c30]">{value ?? '—'}</span>
      {value != null && <span className="text-xs text-[#45464d]">{unit}</span>}
    </div>
  </div>
);

export default RescueHazardDetailPage;
