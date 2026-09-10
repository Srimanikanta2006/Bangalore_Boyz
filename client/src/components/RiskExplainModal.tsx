import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Flame,
  Layers,
  ArrowRight,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">{asset.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                  {asset.wardName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transparent Multi-Hazard Risk Scoring & Explainability Engine (XAI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Composite Score Banner */}
          <div
            className={`p-4 rounded-lg border flex items-center justify-between ${
              risk.compositeRiskScore >= 80
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : risk.compositeRiskScore >= 60
                ? 'bg-orange-50 border-orange-200 text-orange-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Current Composite Risk Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black">{risk.compositeRiskScore}</span>
                <span className="text-sm font-semibold">/ 100</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/80 border border-current">
                  {risk.compositeLevel} Priority State
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider block">
                Primary Driver
              </span>
              <span className="font-bold text-sm">
                {risk.primaryThreat} HAZARD
              </span>
            </div>
          </div>

          {/* Pluvial Flood Decomposition */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <CloudRain className="w-4 h-4 text-blue-700" />
                <span>Pluvial Inundation Risk Decomposition ({risk.floodRisk.score}/100)</span>
              </h4>
              <span className="text-[11px] text-blue-700 font-semibold">
                Projected Depth: ~{risk.floodRisk.projectedInundationDepthCm} cm
              </span>
            </div>
            <p className="text-slate-600 italic leading-relaxed">"{risk.floodRisk.explanation}"</p>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600">
                  <span>Precipitation Hazard Intensity</span>
                  <span className="font-mono text-blue-800 font-bold">{floodFactors.hazardContribution}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${floodFactors.hazardContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600">
                  <span>Topographic Runoff Exposure (Elevation {asset.elevationM}m MSL)</span>
                  <span className="font-mono text-slate-900 font-bold">{floodFactors.exposureContribution}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-700 h-full rounded-full" style={{ width: `${floodFactors.exposureContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600">
                  <span>Drainage Capacity Deficit & Physical Vulnerability</span>
                  <span className="font-mono text-rose-700 font-bold">{floodFactors.vulnerabilityContribution}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: `${floodFactors.vulnerabilityContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600">
                  <span>Pump Resilience Buffer Mitigation</span>
                  <span className="font-mono text-emerald-700 font-bold">-{floodFactors.resilienceMitigation}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${floodFactors.resilienceMitigation}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Urban Heat Stress Decomposition */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>Thermal Stress Decomposition ({risk.heatRisk.score}/100)</span>
              </h4>
              <span className="text-[11px] text-orange-700 font-semibold">
                Apparent Heat Index: {risk.heatRisk.apparentTempC}°C
              </span>
            </div>
            <p className="text-slate-600 italic leading-relaxed">"{risk.heatRisk.explanation}"</p>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600">
                  <span>Wet-Bulb WBGT Thermal Strain</span>
                  <span className="font-mono text-orange-700 font-bold">{heatFactors.hazardContribution}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-600 h-full rounded-full" style={{ width: `${heatFactors.hazardContribution}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-600">
                  <span>Impervious Concrete & Canopy Deficit Exposure</span>
                  <span className="font-mono text-slate-900 font-bold">{heatFactors.exposureContribution}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-700 h-full rounded-full" style={{ width: `${heatFactors.exposureContribution}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Mitigations */}
          <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-1 text-xs uppercase tracking-wider">
              Recommended Structural Mitigation Options
            </h4>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
              <li>Install modular flood barriers at vehicular entrances.</li>
              <li>Upgrade storm drain discharge throughput from {asset.drainageCapacityMmHr} mm/h to 55 mm/h.</li>
              <li>Paint reflective cool-roof coatings to mitigate radiant solar heat gain.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenSOP(asset.id);
            }}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-sky-900 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <span>View Alerts & SOP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
