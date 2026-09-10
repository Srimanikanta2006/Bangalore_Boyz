import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Flame,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { Asset, AssetRiskAssessment } from '../types';

interface RiskExplainModalProps {
  asset: Asset | null;
  risk: AssetRiskAssessment | null;
  onClose: () => void;
  onOpenSOP: (assetId: string) => void;
}

export const RiskExplainModal: React.FC<RiskExplainModalProps> = ({
  asset,
  risk,
  onClose,
  onOpenSOP,
}) => {
  if (!asset || !risk) return null;

  const floodFactors = risk.floodRisk.factors;
  const heatFactors = risk.heatRisk.factors;
  const isFloodDominant = risk.floodRisk.score >= risk.heatRisk.score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">{asset.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {asset.wardName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transparent Multi-Hazard Risk Scoring & Explainability Engine (XAI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Composite Score Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Composite Risk Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`text-3xl font-black ${
                    risk.compositeRiskScore >= 80
                      ? 'text-red-400'
                      : risk.compositeRiskScore >= 60
                      ? 'text-orange-400'
                      : risk.compositeRiskScore >= 35
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {risk.compositeRiskScore}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    risk.compositeLevel === 'CRITICAL'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : risk.compositeLevel === 'HIGH'
                      ? 'bg-orange-950 text-orange-300 border border-orange-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {risk.compositeLevel} Priority
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Primary Driver
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-bold text-cyan-400 text-sm">
                {risk.primaryThreat === 'FLOOD' && (
                  <>
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    <span>Pluvial Flood Hazard</span>
                  </>
                )}
                {risk.primaryThreat === 'HEAT' && (
                  <>
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Urban Thermal Stress</span>
                  </>
                )}
                {risk.primaryThreat === 'COMPOUND' && (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Compound Flood + Heat</span>
                  </>
                )}
                {risk.primaryThreat === 'NONE' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Nominal Baseline</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Pluvial Flood Decomposition */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                <CloudRain className="w-4 h-4 text-blue-400" />
                <span>Pluvial Flood Risk Decomposition ({risk.floodRisk.score}/100)</span>
              </h4>
              <span className="text-[11px] text-blue-400 font-semibold">
                Projected Inundation: ~{risk.floodRisk.projectedInundationDepthCm} cm
              </span>
            </div>
            <p className="text-slate-400 mb-3 italic">"{risk.floodRisk.explanation}"</p>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Precipitation Hazard Intensity</span>
                  <span className="font-mono text-blue-400 font-bold">{floodFactors.hazardContribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${floodFactors.hazardContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Topographic Elevation & Runoff Exposure</span>
                  <span className="font-mono text-cyan-400 font-bold">{floodFactors.exposureContribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${floodFactors.exposureContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Drainage Capacity Deficit & Physical Vulnerability</span>
                  <span className="font-mono text-amber-400 font-bold">{floodFactors.vulnerabilityContribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${floodFactors.vulnerabilityContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Resilience / Pump Mitigation Buffer</span>
                  <span className="font-mono text-emerald-400 font-bold">{floodFactors.resilienceMitigation}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${floodFactors.resilienceMitigation}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Urban Heat Stress Decomposition */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Thermal Heat Stress Decomposition ({risk.heatRisk.score}/100)</span>
              </h4>
              <span className="text-[11px] text-orange-400 font-semibold">
                Apparent Heat Index: {risk.heatRisk.apparentTempC}°C
              </span>
            </div>
            <p className="text-slate-400 mb-3 italic">"{risk.heatRisk.explanation}"</p>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Thermal Hazard & Wet-Bulb Stress</span>
                  <span className="font-mono text-orange-400 font-bold">{heatFactors.hazardContribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${heatFactors.hazardContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Urban Heat Island & Impervious Surface Trapping</span>
                  <span className="font-mono text-red-400 font-bold">{heatFactors.exposureContribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${heatFactors.exposureContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Population Density & Grid Vulnerability</span>
                  <span className="font-mono text-purple-400 font-bold">{heatFactors.vulnerabilityContribution}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${heatFactors.vulnerabilityContribution}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Long-Term Resilience Recommendations */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
            <h4 className="font-bold text-cyan-300 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Recommended Long-Term Infrastructure Interventions:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
              {asset.elevationM < 885 && (
                <li>Deploy automated flood-gate barriers along asset vehicular ingress points.</li>
              )}
              {!asset.hasDewateringPumps && (
                <li>Install permanent submersible sump ejector pumps with backup diesel generators.</li>
              )}
              {asset.imperviousPct > 80 && (
                <li>Incorporate permeable paving and bioswales to reduce localized pluvial runoff by ~35%.</li>
              )}
              {asset.type === 'HOSPITAL' && (
                <li>Relocate ground-floor backup power switchboards to elevated floor level &gt;900m MSL.</li>
              )}
              <li>Apply high-albedo reflective cool roof coatings to reduce indoor thermal stress by 3.5°C.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenSOP(asset.id);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition"
          >
            <span>View Incident Response SOP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
