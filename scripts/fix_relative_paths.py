import os
import re

BASE_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz"
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# 1. Write root index.html in Bangalore_Boyz
root_index_html = """<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=frontend/login.html" />
  <script>window.location.href = "frontend/login.html";</script>
</head>
<body>
  <p>Redirecting to <a href="frontend/login.html">ClimateShield Login</a>...</p>
</body>
</html>
"""
with open(os.path.join(BASE_DIR, "index.html"), 'w', encoding='utf-8') as f:
    f.write(root_index_html)
print("Created root index.html")

# 2. Write frontend/index.html
frontend_index_html = """<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=login.html" />
  <script>window.location.href = "login.html";</script>
</head>
<body>
  <p>Redirecting to <a href="login.html">Login</a>...</p>
</body>
</html>
"""
with open(os.path.join(FRONTEND_DIR, "index.html"), 'w', encoding='utf-8') as f:
    f.write(frontend_index_html)
print("Created frontend/index.html")

# 3. Update frontend/shared/app.js
app_js_content = """/**
 * ClimateShield Application Core Engine
 * Handles navigation partial injection, active highlighting,
 * relative path resolution, data binding, and in-page modal/sheet toggles.
 */

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    initShell();
    initDataBinding();
    initInteractivity();
  });

  function getBasePath() {
    const path = window.location.pathname.replace(/\\\\/g, '/');
    if (path.includes('/citizen/') || path.includes('/government/') || path.includes('/rescue/')) {
      return '../';
    }
    return './';
  }

  function initShell() {
    const navPlaceholder = document.getElementById("app-nav");
    if (!navPlaceholder) return;

    const base = getBasePath();
    fetch(base + "shared/nav.html")
      .then((res) => {
        if (!res.ok) throw new Error("Nav partial not found");
        return res.text();
      })
      .then((html) => {
        navPlaceholder.innerHTML = html;
        activateCurrentRoleNav();
      })
      .catch((err) => console.warn("Nav partial failed to load:", err));
  }

  function activateCurrentRoleNav() {
    const path = window.location.pathname.replace(/\\\\/g, '/');

    let role = "citizen";
    if (path.includes("/government/")) {
      role = "government";
      document.body.classList.add("has-gov-sidebar");
    } else if (path.includes("/rescue/")) {
      role = "rescue";
    } else if (path.includes("login.html")) {
      return; // Login page has no shell nav
    }

    const navElem = document.getElementById(`nav-${role}`);
    if (navElem) {
      navElem.classList.remove("hidden");
    }

    // Highlight matching link
    const filename = path.split('/').pop();
    const links = document.querySelectorAll(`#nav-${role} a.nav-item`);
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && (href === filename || href.endsWith('/' + filename))) {
        link.classList.add("active");
      }
    });
  }

  function initDataBinding() {
    const bindElems = document.querySelectorAll("[data-bind]");
    if (bindElems.length === 0) return;

    const mode = window.CONFIG ? window.CONFIG.DATA_MODE : "mock";
    const dataSources = ["kpis", "hazards", "incidents", "missions", "routes", "hotspots"];
    const base = getBasePath();

    dataSources.forEach((source) => {
      const url = mode === "mock" 
        ? `${base}data/${source}.json` 
        : `${window.CONFIG.API_BASE_URL}/${source}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          bindElems.forEach((elem) => {
            const key = elem.getAttribute("data-bind");
            const [src, field] = key.split(".");
            if (src === source && data) {
              const val = data[field];
              if (val !== undefined) {
                elem.textContent = val;
              }
            }
          });
        })
        .catch((err) => console.log(`Data fetch info (${source}):`, err.message));
    });
  }

  function initInteractivity() {
    document.body.addEventListener("click", function (e) {
      // Dispatch Team Button Handler
      const dispatchBtn = e.target.closest("[data-action='dispatch-team']");
      if (dispatchBtn) {
        e.preventDefault();
        dispatchBtn.textContent = "Dispatched ✓";
        dispatchBtn.classList.remove("bg-primary", "bg-secondary");
        dispatchBtn.classList.add("bg-emerald-600", "text-white");
        
        setTimeout(() => {
          const base = getBasePath();
          window.location.href = base + "rescue/mission_detail.html";
        }, 600);
      }

      // Toggle Flood Sheet Panel (In-Page)
      const floodTrigger = e.target.closest("[data-action='toggle-flood-sheet']");
      if (floodTrigger) {
        e.preventDefault();
        const sheet = document.getElementById("flood-sheet-modal");
        if (sheet) sheet.classList.toggle("hidden");
      }

      // Toggle Zone Detail Side Panel (In-Page)
      const zoneTrigger = e.target.closest("[data-action='toggle-zone-detail']");
      if (zoneTrigger) {
        e.preventDefault();
        const panel = document.getElementById("zone-detail-panel");
        if (panel) panel.classList.toggle("hidden");
      }
    });
  }
})();
"""
with open(os.path.join(FRONTEND_DIR, "shared", "app.js"), 'w', encoding='utf-8') as f:
    f.write(app_js_content)
print("Updated frontend/shared/app.js")

# 4. Update frontend/shared/nav.html to use relative paths
nav_html_content = """<!-- ClimateShield Shared Navigation Partial -->

<!-- Citizen Navigation (Mobile Bottom Navigation Bar) -->
<nav id="nav-citizen" class="role-nav hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/30 px-4 py-2 pb-safe">
  <div class="max-w-md mx-auto flex items-center justify-around relative">
    <a href="home.html" data-nav="citizen-home" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
      <span class="material-symbols-outlined text-[24px]">map</span>
      <span class="font-label-sm text-[10px]">Map</span>
    </a>
    <a href="alerts.html" data-nav="citizen-alerts" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
      <span class="material-symbols-outlined text-[24px]">notifications_active</span>
      <span class="font-label-sm text-[10px]">Alerts</span>
    </a>
    <!-- SOS Center FAB -->
    <a href="sos.html" data-nav="citizen-sos" class="flex flex-col items-center justify-center -mt-6 bg-error text-on-error w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform border-2 border-surface">
      <span class="material-symbols-outlined text-[28px] animate-pulse">sos</span>
    </a>
    <a href="report.html" data-nav="citizen-report" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
      <span class="material-symbols-outlined text-[24px]">add_alert</span>
      <span class="font-label-sm text-[10px]">Report</span>
    </a>
    <a href="route_selection.html" data-nav="citizen-routes" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
      <span class="material-symbols-outlined text-[24px]">alt_route</span>
      <span class="font-label-sm text-[10px]">Routes</span>
    </a>
  </div>
</nav>

<!-- Government Navigation (Desktop Left Sidebar Rail) -->
<aside id="nav-government" class="role-nav hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex-col py-6 px-4 hidden md:flex">
  <div class="flex items-center gap-3 px-2 mb-8">
    <div class="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-lg shadow-sm">CS</div>
    <div>
      <h1 class="font-headline-md text-base text-on-surface font-bold leading-none">ClimateShield</h1>
      <span class="font-code-sm text-[11px] text-secondary font-semibold">Government EOC</span>
    </div>
  </div>
  
  <div class="flex-1 flex flex-col gap-1 overflow-y-auto">
    <div class="text-[10px] font-label-sm text-on-surface-variant/70 uppercase tracking-wider px-3 py-1 font-bold">Operational Command</div>
    <a href="overview.html" data-nav="gov-overview" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-sm">
      <span class="material-symbols-outlined text-[20px]">dashboard</span>
      <span>Command Center</span>
    </a>
    <a href="response_center.html" data-nav="gov-response" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-sm">
      <span class="material-symbols-outlined text-[20px]">emergency</span>
      <span>Response Center</span>
    </a>
    <a href="critical_assets.html" data-nav="gov-assets" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-sm">
      <span class="material-symbols-outlined text-[20px]">domain</span>
      <span>Critical Assets</span>
    </a>
    <a href="simulator.html" data-nav="gov-simulator" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-sm">
      <span class="material-symbols-outlined text-[20px]">tsunami</span>
      <span>Disaster Simulator</span>
    </a>
    
    <div class="text-[10px] font-label-sm text-on-surface-variant/70 uppercase tracking-wider px-3 py-1 font-bold mt-4">Field Tactical</div>
    <a href="mobile_map.html" data-nav="gov-mobile-map" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-sm">
      <span class="material-symbols-outlined text-[20px]">map</span>
      <span>Live Map & Stack</span>
    </a>
    <a href="mobile_triage.html" data-nav="gov-triage" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-sm">
      <span class="material-symbols-outlined text-[20px]">assignment_late</span>
      <span>Incident Triage</span>
    </a>
  </div>
  
  <div class="pt-4 border-t border-outline-variant/30 flex items-center justify-between px-2">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center">
        <span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>
      </div>
      <div>
        <div class="font-label-md text-xs text-on-surface">Director EOC</div>
        <div class="font-code-sm text-[10px] text-on-surface-variant">District 4</div>
      </div>
    </div>
    <a href="../login.html" class="text-on-surface-variant hover:text-error transition-colors" title="Switch Role">
      <span class="material-symbols-outlined text-[20px]">logout</span>
    </a>
  </div>
</aside>

<!-- Rescue Navigation (Mobile Bottom Navigation Bar) -->
<nav id="nav-rescue" class="role-nav hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/30 px-4 py-2 pb-safe">
  <div class="max-w-md mx-auto flex items-center justify-around">
    <a href="home.html" data-nav="rescue-home" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-secondary transition-colors">
      <span class="material-symbols-outlined text-[24px]">radar</span>
      <span class="font-label-sm text-[10px]">Tactical Map</span>
    </a>
    <a href="mission_detail.html" data-nav="rescue-mission" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-secondary transition-colors">
      <span class="material-symbols-outlined text-[24px]">assignment_turned_in</span>
      <span class="font-label-sm text-[10px]">Missions</span>
    </a>
    <a href="active_nav.html" data-nav="rescue-nav" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-secondary transition-colors">
      <span class="material-symbols-outlined text-[24px]">navigation</span>
      <span class="font-label-sm text-[10px]">Active Nav</span>
    </a>
    <a href="status_report.html" data-nav="rescue-status" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-secondary transition-colors">
      <span class="material-symbols-outlined text-[24px]">fact_check</span>
      <span class="font-label-sm text-[10px]">Status Report</span>
    </a>
    <a href="command_console.html" data-nav="rescue-console" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-secondary transition-colors">
      <span class="material-symbols-outlined text-[24px]">terminal</span>
      <span class="font-label-sm text-[10px]">Console</span>
    </a>
  </div>
</nav>
"""
with open(os.path.join(FRONTEND_DIR, "shared", "nav.html"), 'w', encoding='utf-8') as f:
    f.write(nav_html_content)
print("Updated frontend/shared/nav.html")

# 5. Fix HTML script tags and hrefs across subdirectories
def fix_html_file(filepath):
    rel_from_frontend = os.path.relpath(filepath, FRONTEND_DIR).replace('\\', '/')
    is_root = '/' not in rel_from_frontend
    prefix = "./" if is_root else "../"

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace /shared/ with prefix + shared/
    content = content.replace('src="/shared/config.js"', f'src="{prefix}shared/config.js"')
    content = content.replace('href="/shared/app.css"', f'href="{prefix}shared/app.css"')
    content = content.replace('src="/shared/app.js"', f'src="{prefix}shared/app.js"')

    # Replace absolute route paths with relative paths
    if is_root:
        content = content.replace('href="/citizen/home.html"', 'href="citizen/home.html"')
        content = content.replace("href='/citizen/home.html'", "href='citizen/home.html'")
        content = content.replace("location.href='/citizen/home.html'", "location.href='citizen/home.html'")
        content = content.replace("location.href='/government/overview.html'", "location.href='government/overview.html'")
        content = content.replace("location.href='/rescue/home.html'", "location.href='rescue/home.html'")
    else:
        # Inside subdirectories (citizen/, government/, rescue/)
        content = content.replace('href="/citizen/', 'href="../citizen/')
        content = content.replace('href="/government/', 'href="../government/')
        content = content.replace('href="/rescue/', 'href="../rescue/')
        content = content.replace('href="/login.html"', 'href="../login.html"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed relative paths: {rel_from_frontend}")

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith('.html') and 'stitch_export' not in root:
            fix_html_file(os.path.join(root, file))

