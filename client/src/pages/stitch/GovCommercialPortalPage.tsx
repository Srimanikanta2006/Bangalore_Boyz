import React, { useState } from 'react';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { getActiveRegion } from '../../citizen/geo';
import { api } from '../../lib/api';
import { 
  Building2, ShieldCheck, Zap, Key, FileText, 
  Sparkles, CheckCircle2, Sliders, TrendingUp, Layers, 
  Download, ArrowRight, Server, Copy, Check
} from 'lucide-react';

// Extend window for Razorpay script
declare global { interface Window { Razorpay: new (opts: object) => { open(): void }; } }

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.head.appendChild(s);
  });
}

export const GovCommercialPortalPage: React.FC = () => {
  const activeRegion = getActiveRegion();
  const isNepal = activeRegion === 'NEPAL';

  // Calculator State
  const [monitoredAssets, setMonitoredAssets] = useState(84);
  const [telemetrySensors, setTelemetrySensors] = useState(140);
  const [apiQueries, setApiQueries] = useState(25000);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  // Copy API key state
  const [copied, setCopied] = useState(false);
  const [esgDownloading, setEsgDownloading] = useState(false);

  // Payment state
  const [payingTier, setPayingTier] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{ tier: string; status: 'success' | 'failed' | 'cancelled' } | null>(null);

  const handlePayment = async (tier: 'starter' | 'pro' | 'enterprise') => {
    setPayingTier(tier);
    setPaymentStatus(null);
    try {
      await loadRazorpayScript();

      // 1. Create order on backend (backend owns the price)
      const order = await api.post<{
        orderId: string; amount: number; currency: string; keyId: string; planLabel: string;
      }>('/billing/orders', { planId: tier });

      // 2. Open Razorpay Checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'ClimateShield',
          description: order.planLabel,
          order_id: order.orderId,
          theme: { color: '#0051d5' },
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              // 3. Verify signature on backend
              await api.post('/billing/payments/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setPaymentStatus({ tier, status: 'success' });
              setSelectedTier(tier);
              resolve();
            } catch {
              setPaymentStatus({ tier, status: 'failed' });
              reject(new Error('Verification failed'));
            }
          },
          modal: {
            ondismiss: () => {
              setPaymentStatus({ tier, status: 'cancelled' });
              reject(new Error('cancelled'));
            },
          },
        });
        rzp.open();
      }).catch(() => {});
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'cancelled') {
        setPaymentStatus({ tier, status: 'failed' });
      }
    } finally {
      setPayingTier(null);
    }
  };

  // Revenue calculation logic in INR (₹)
  const tierBasePrice = { starter: 1499, pro: 3999, enterprise: 11990 }[selectedTier];
  const assetCost = monitoredAssets * 35;
  const sensorCost = Math.round(telemetrySensors * 9.5);
  const apiCost = Math.round((apiQueries / 1000) * 40);

  const estimatedMrr = tierBasePrice + assetCost + sensorCost + apiCost;
  const estimatedArr = estimatedMrr * 12;

  const handleCopyKey = () => {
    navigator.clipboard.writeText('cs_live_pk_998240219842109482109482');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadEsgReport = () => {
    setEsgDownloading(true);
    setTimeout(() => {
      const esgReport = {
        reportType: 'ENVIRONMENTAL_SOCIAL_GOVERNANCE_COMPLIANCE',
        certifiedRegion: isNepal ? 'Kathmandu Valley Basin' : 'Chennai East Basin',
        auditStandard: 'ISO-14090 Climate Adaptation & Risk Resilience Framework',
        generatedAt: new Date().toISOString(),
        resilienceMetrics: {
          assetVulnerabilityIndex: '18.4 / 100 (LOW EXPOSURE)',
          floodMitigationCapacity: '96.2% High Preparedness',
          powerFailoverRedundancy: '100% Secured (72h Battery Backup)',
          averageEmergencyDispatchLatency: '42ms',
          citizenSafetyCorridorCoverage: '98.4%',
        },
        financialRiskAssessment: {
          avoidedPhysicalDamageCost: isNepal ? '₹35 Lakhs INR (Kathmandu Basin)' : '₹1.05 Crores INR (East Basin)',
          insurancePremiumDiscountEligibility: '14.5% Reduction',
          municipalBondResilienceGrade: 'AAA+ Certified Resilience',
        },
        complianceSeal: 'AUTHENTICATED_CLIMATESHIELD_B2G_PLATFORM'
      };

      const blob = new Blob([JSON.stringify(esgReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ClimateShield_ESG_Resilience_Report_${activeRegion}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setEsgDownloading(false);
    }, 600);
  };

  return (
    <GovHqLayout activePath="/gov/commercial">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Top Commercial Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-400/30">
                B2G & B2B COMMERCIAL EXPANSION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/30">
                REVENUE HUB (INR ₹)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Enterprise Monetization & Municipal Organization Portal
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed">
              Sustainable recurring revenue engine powering ClimateShield via multi-tier municipal subscriptions, asset telemetry metering, InsurTech partner APIs, and certified ESG climate reporting.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Calculated MRR</span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono flex items-center">
                ₹{estimatedMrr.toLocaleString('en-IN')} <span className="text-xs text-slate-300 font-normal ml-1">/mo</span>
              </span>
              <span className="text-[11px] text-slate-300 block mt-0.5">ARR: ₹{estimatedArr.toLocaleString('en-IN')}</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadEsgReport}
              disabled={esgDownloading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{esgDownloading ? 'Generating...' : 'Export ESG Audit'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: Tiered Enterprise & Municipal Plans (INR Pricing) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0b1c30]">1. Tiered Municipal & Enterprise Plans (INR ₹)</h2>
              <p className="text-xs text-[#76777d]">Flexible B2G licensing tailored for city councils, emergency agencies, and infrastructure grids.</p>
            </div>
            <span className="text-xs font-mono text-[#0051d5] font-bold bg-[#eff4ff] px-2.5 py-1 rounded-full border border-[#d3e4fe]">
              ANNUAL BILLING (15% SAVINGS)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier 1: Municipal Starter */}
            <div 
              onClick={() => setSelectedTier('starter')}
              className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedTier === 'starter' 
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-lg' 
                  : 'border-[#e5eeff] hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-[#76777d] tracking-wider block">Tier 1 · Municipal Core</span>
                <h3 className="text-xl font-bold text-[#0b1c30] mt-1">Single EOC Fleet</h3>
                <p className="text-xs text-[#45464d] mt-1">Ideal for small municipalities and local flood control districts.</p>
                <div className="my-4">
                  <span className="text-3xl font-extrabold text-[#0b1c30]">₹1,499</span>
                  <span className="text-xs text-[#76777d]"> / month</span>
                </div>
                <ul className="space-y-2 text-xs text-[#45464d]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Single Emergency Operations Center</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to 25 Monitored Critical Assets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard Citizen Hazard Alerting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>99.5% Service Level Agreement</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handlePayment('starter'); }}
                disabled={payingTier === 'starter'}
                className={`w-full mt-6 py-2 rounded-xl text-xs font-bold transition-colors ${
                  paymentStatus?.tier === 'starter' && paymentStatus.status === 'success'
                    ? 'bg-emerald-600 text-white'
                    : selectedTier === 'starter' ? 'bg-blue-600 text-white' : 'bg-[#eff4ff] text-[#0051d5] hover:bg-[#e5eeff]'
                }`}
              >
                {payingTier === 'starter' ? 'Processing…' : paymentStatus?.tier === 'starter' && paymentStatus.status === 'success' ? '✓ Plan Activated' : selectedTier === 'starter' ? 'Pay ₹1,499' : 'Select Starter'}
              </button>
            </div>

            {/* Tier 2: Statewide Operational (RECOMMENDED) */}
            <div 
              onClick={() => setSelectedTier('pro')}
              className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedTier === 'pro' 
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-lg' 
                  : 'border-[#e5eeff] hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                MOST POPULAR
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-blue-600 tracking-wider block">Tier 2 · Statewide EOC</span>
                <h3 className="text-xl font-bold text-[#0b1c30] mt-1">Multi-Region Command</h3>
                <p className="text-xs text-[#45464d] mt-1">For state agencies, regional flood authorities, and urban transport grids.</p>
                <div className="my-4">
                  <span className="text-3xl font-extrabold text-[#0b1c30]">₹3,999</span>
                  <span className="text-xs text-[#76777d]"> / month</span>
                </div>
                <ul className="space-y-2 text-xs text-[#45464d]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited EOC Command Centers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>AI Cascade Risk Assessment Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>150 Telemetry Hydro-Sensors Included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Automated SITREP & Vulnerability Exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>99.9% High Availability SLA</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handlePayment('pro'); }}
                disabled={payingTier === 'pro'}
                className={`w-full mt-6 py-2 rounded-xl text-xs font-bold transition-colors ${
                  paymentStatus?.tier === 'pro' && paymentStatus.status === 'success'
                    ? 'bg-emerald-600 text-white'
                    : selectedTier === 'pro' ? 'bg-blue-600 text-white' : 'bg-[#eff4ff] text-[#0051d5] hover:bg-[#e5eeff]'
                }`}
              >
                {payingTier === 'pro' ? 'Processing…' : paymentStatus?.tier === 'pro' && paymentStatus.status === 'success' ? '✓ Plan Activated' : selectedTier === 'pro' ? 'Pay ₹3,999' : 'Select Statewide'}
              </button>
            </div>

            {/* Tier 3: Enterprise & InsurTech */}
            <div 
              onClick={() => setSelectedTier('enterprise')}
              className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedTier === 'enterprise' 
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-lg' 
                  : 'border-[#e5eeff] hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-purple-600 tracking-wider block">Tier 3 · InsurTech & Grid</span>
                <h3 className="text-xl font-bold text-[#0b1c30] mt-1">Enterprise Resilience</h3>
                <p className="text-xs text-[#45464d] mt-1">For national utilities, REITs, insurance underwriters, and logistics fleets.</p>
                <div className="my-4">
                  <span className="text-3xl font-extrabold text-[#0b1c30]">₹11,990</span>
                  <span className="text-xs text-[#76777d]"> / month</span>
                </div>
                <ul className="space-y-2 text-xs text-[#45464d]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time Certified ESG Compliance Reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>White-Label Custom Citizen App Branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Partner Risk APIs (Parametric Underwriting)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated Technical Account Manager</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handlePayment('enterprise'); }}
                disabled={payingTier === 'enterprise'}
                className={`w-full mt-6 py-2 rounded-xl text-xs font-bold transition-colors ${
                  paymentStatus?.tier === 'enterprise' && paymentStatus.status === 'success'
                    ? 'bg-emerald-600 text-white'
                    : selectedTier === 'enterprise' ? 'bg-blue-600 text-white' : 'bg-[#eff4ff] text-[#0051d5] hover:bg-[#e5eeff]'
                }`}
              >
                {payingTier === 'enterprise' ? 'Processing…' : paymentStatus?.tier === 'enterprise' && paymentStatus.status === 'success' ? '✓ Plan Activated' : selectedTier === 'enterprise' ? 'Pay ₹11,990' : 'Select Enterprise'}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Usage-Based Revenue Calculator (INR ₹) */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0b1c30]">2. Per-Asset & Telemetry Usage Metering (INR ₹)</h2>
              <p className="text-xs text-[#76777d]">Scale revenue dynamically based on registered IoT telemetry nodes and monitored infrastructure.</p>
            </div>
            <div className="flex items-center gap-2 bg-[#eff4ff] px-3 py-1.5 rounded-xl border border-[#d3e4fe]">
              <Sliders className="w-4 h-4 text-[#0051d5]" />
              <span className="text-xs font-bold text-[#0051d5]">LIVE REVENUE METER</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Meter 1: Monitored Assets */}
            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#0b1c30]">Critical Assets Monitored</span>
                <span className="font-mono font-bold text-blue-600">{monitoredAssets} Assets (₹35/ea)</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="500" 
                value={monitoredAssets}
                onChange={(e) => setMonitoredAssets(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer" 
              />
              <span className="text-[11px] text-[#76777d] block">Monthly Asset Revenue: ₹{(monitoredAssets * 35).toLocaleString('en-IN')}</span>
            </div>

            {/* Meter 2: Telemetry IoT Sensors */}
            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#0b1c30]">IoT Hydro-Sensors</span>
                <span className="font-mono font-bold text-emerald-600">{telemetrySensors} Sensors (₹9.50/ea)</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="1000" 
                value={telemetrySensors}
                onChange={(e) => setTelemetrySensors(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer" 
              />
              <span className="text-[11px] text-[#76777d] block">Monthly Sensor Revenue: ₹{Math.round(telemetrySensors * 9.5).toLocaleString('en-IN')}</span>
            </div>

            {/* Meter 3: Partner API Calls */}
            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#0b1c30]">Partner Risk API Queries</span>
                <span className="font-mono font-bold text-purple-600">{apiQueries.toLocaleString('en-IN')} Calls/mo</span>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="500000" 
                step="5000"
                value={apiQueries}
                onChange={(e) => setApiQueries(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer" 
              />
              <span className="text-[11px] text-[#76777d] block">Monthly API Metering: ₹{apiCost.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Partner API & Developer Marketplace */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                  PARTNER MARKETPLACE
                </span>
                <span className="text-xs text-slate-400 font-mono">B2B API Monetization</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">ClimateRisk REST API & Logistics Integration</h2>
              <p className="text-xs text-slate-300">Allow third-party delivery fleets, ride-hailing apps, and insurance platforms to query real-time flood risk coordinates.</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 w-full md:w-auto">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <code className="text-xs font-mono text-slate-300 truncate max-w-[200px]">cs_live_pk_9982...</code>
              <button 
                type="button"
                onClick={handleCopyKey}
                className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-200" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>SAMPLE ENDPOINT CALL</span>
              <span className="text-emerald-400 font-bold">200 OK (12ms)</span>
            </div>
            <p className="text-amber-300">POST https://api.climateshield.org/v1/risk/evaluate-route</p>
            <pre className="text-slate-400 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800 text-[11px]">
{`{
  "origin": [${isNepal ? '27.6830, 85.3080' : '13.0650, 80.2700'}],
  "destination": [${isNepal ? '27.6950, 85.3150' : '13.0640, 80.2760'}],
  "vehicleType": "HEAVY_LOGISTICS_TRUCK",
  "clientKey": "cs_live_pk_998240219842109482109482"
}`}
            </pre>
          </div>
        </div>

        {/* SECTION 4: White-Label Branding & Municipal Org Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#e5eeff] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-[#0b1c30] text-sm">White-Label Organization Branding</h3>
            </div>
            <p className="text-xs text-[#45464d]">
              Enterprise customers can customize the Citizen Portal with their own municipal logo, domain (`flood.city.gov`), and custom color accents.
            </p>
            <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0b1c30]">Custom Subdomain:</span>
              <span className="font-mono text-blue-600 font-bold">{isNepal ? 'kathmandu.climateshield.gov' : 'chennai.climateshield.gov'}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e5eeff] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-[#0b1c30] text-sm">Multi-Tenant EOC Role Security</h3>
            </div>
            <p className="text-xs text-[#45464d]">
              Manage role permissions across EOC Directors, Field Responders, and Public Safety Communication Officers with strict JWT RBAC guardrails.
            </p>
            <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0b1c30]">Active EOC Responders:</span>
              <span className="font-mono text-emerald-600 font-bold">14 Authorized Accounts</span>
            </div>
          </div>
        </div>

      </div>
    </GovHqLayout>
  );
};

export default GovCommercialPortalPage;
