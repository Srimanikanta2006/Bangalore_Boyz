import os

BASE_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz"
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

p4_contract_html = """
<!-- P4 AI AGENT INTEGRATION CONTRACT BOX (MVP PRIORITY ORDER 1-8) -->
<div id="p4-explain-container" class="p-space-md bg-surface-container-lowest border-2 border-secondary/30 rounded-xl shadow-md space-y-3 my-3">
  <!-- Header & Confidence -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
      <span class="font-label-sm text-xs uppercase tracking-wider text-secondary font-bold">P4 AI Agent Causal Intelligence</span>
    </div>
    <span id="p4-confidence" class="font-code-sm text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">88% Confidence</span>
  </div>

  <!-- 1. situationSummary -->
  <div class="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
    <div class="text-[10px] font-label-sm text-outline uppercase font-bold tracking-wider mb-1">1. Situation Summary</div>
    <p id="p4-situation-summary" class="font-body-sm text-sm text-on-surface leading-relaxed">
      Heavy rainfall has exceeded local drainage threshold at Drain D07, causing high waterlogging risk that threatens Road R24 and ambulance access to Hospital A.
    </p>
  </div>

  <!-- 2. causalChains (Cascade Path Diagram) -->
  <div class="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
    <div class="text-[10px] font-label-sm text-outline uppercase font-bold tracking-wider mb-1">2. Causal Cascade Path</div>
    <div class="flex items-center gap-2 font-code-sm text-xs font-bold text-secondary bg-surface-container p-2 rounded-md overflow-x-auto">
      <span class="material-symbols-outlined text-[16px]">account_tree</span>
      <span id="p4-causal-chain-path">D07 → R24 → Hospital-A</span>
    </div>
    <p id="p4-causal-chain-explanation" class="font-body-sm text-xs text-on-surface-variant mt-1.5 leading-normal">
      Drain D07 capacity surge overflows onto Road R24 arterial corridor, cutting off primary ambulance access to Hospital A within 25 minutes.
    </p>
  </div>

  <!-- 3. keyImpacts / affectedAssets -->
  <div class="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
    <div class="text-[10px] font-label-sm text-outline uppercase font-bold tracking-wider mb-1">3. Key Asset Impacts</div>
    <div id="p4-key-impacts" class="flex flex-wrap gap-1.5 pt-0.5">
      <span class="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">D07: Inundation Overflow (HIGH)</span>
      <span class="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">R24: Submerged Segment (HIGH)</span>
      <span class="px-2 py-0.5 rounded text-xs font-semibold bg-red-200 text-red-900 font-bold">Hospital-A: Ambulance Access (CRITICAL)</span>
    </div>
  </div>

  <!-- 4 & 5. recommendedActions & Priority -->
  <div class="p-2.5 rounded-lg bg-primary-container text-on-primary border border-primary/20 shadow-sm">
    <div class="flex items-center justify-between mb-1">
      <span class="text-[10px] font-label-sm uppercase font-bold tracking-wider text-tertiary-fixed">4 & 5. Recommended Action & Priority</span>
      <span id="p4-action-priority" class="px-2 py-0.5 rounded-full bg-error text-on-error font-code-sm text-[11px] font-extrabold">CRITICAL</span>
    </div>
    <div id="p4-action-target" class="font-title-lg text-sm font-bold text-white mb-0.5">dispatch_drainage_team → Target D07</div>
    <p id="p4-action-reason" class="font-body-sm text-xs text-on-primary-container leading-relaxed">
      Reduce the risk of waterlogging at Drain D07 before it affects Road R24.
    </p>
  </div>

  <!-- 6 & 7. Uncertainties & Data Freshness -->
  <div class="flex items-center justify-between text-xs text-on-surface-variant font-code-sm px-1">
    <div class="flex items-center gap-1">
      <span class="material-symbols-outlined text-[14px]">help_outline</span>
      <span id="p4-uncertainties">Secondary storm cell trajectory ±15 mins</span>
    </div>
    <span class="text-emerald-600 font-bold">● Fresh Data</span>
  </div>

  <!-- 8. CONTRACT 3 — Operator Approval Button -->
  <div class="pt-2">
    <button data-action="approve-recommendation"
            data-incident-id="INC-001"
            data-action-id="dispatch_drainage_team"
            data-target-asset="D07"
            data-priority="critical"
            data-reason="Reduce the risk of waterlogging at Drain D07 before it affects Road R24."
            class="w-full py-3 rounded-xl bg-primary text-on-primary font-body-md font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-all cursor-pointer">
      <span class="material-symbols-outlined text-[20px]">verified_user</span>
      <span>8. Approve Recommendation & Create Task (P1)</span>
    </button>
    <div class="text-[10px] font-body-sm text-center text-outline mt-1">Requires explicit human operator click. Never auto-executes.</div>
  </div>
</div>
"""

# Embed into government/zone_detail.html
zd_path = os.path.join(FRONTEND_DIR, "government", "zone_detail.html")
with open(zd_path, 'r', encoding='utf-8') as f:
    zd_content = f.read()

if "id=\"p4-explain-container\"" not in zd_content:
    zd_content = zd_content.replace(
        '<div class="flex-1 px-space-lg py-space-sm overflow-y-auto space-y-space-md">',
        f'<div class="flex-1 px-space-lg py-space-sm overflow-y-auto space-y-space-md">\n{p4_contract_html}',
        1
    )
    with open(zd_path, 'w', encoding='utf-8') as f:
        f.write(zd_content)
    print("Embedded Contract 2 & 3 MVP Box into zone_detail.html")

# Embed into government/overview.html
ov_path = os.path.join(FRONTEND_DIR, "government", "overview.html")
with open(ov_path, 'r', encoding='utf-8') as f:
    ov_content = f.read()

if "id=\"p4-explain-container\"" not in ov_content:
    ov_content = ov_content.replace(
        '<div class="p-space-md flex flex-col gap-space-md">',
        f'<div class="p-space-md flex flex-col gap-space-md">\n{p4_contract_html}',
        1
    )
    with open(ov_path, 'w', encoding='utf-8') as f:
        f.write(ov_content)
    print("Embedded Contract 2 & 3 MVP Box into overview.html")

