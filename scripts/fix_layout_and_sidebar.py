import os
import re

BASE_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz"
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# 1. Update frontend/shared/app.css to remove body padding hacks
app_css_content = """/* ClimateShield Shared Shell & Component Extensions */

/* Active Link Styling */
.nav-item.active {
  color: var(--color-primary, #0051d5) !important;
  font-weight: 700;
}

/* Ensure no double scrollbars or unwanted offsets */
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* In-Page Modal & Sliding Panel Utilities */
.drawer-backdrop {
  transition: opacity 0.25s ease-in-out;
}

.drawer-panel {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-panel.hidden-panel {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .drawer-panel.hidden-panel-desktop {
    transform: translateX(100%);
  }
}
"""

with open(os.path.join(FRONTEND_DIR, "shared", "app.css"), 'w', encoding='utf-8') as f:
    f.write(app_css_content)
print("Updated frontend/shared/app.css")

# 2. Update frontend/shared/nav.html
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

<!-- Government Navigation (Mobile Bottom Bar for Mobile Government Views) -->
<nav id="nav-government" class="role-nav hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/30 px-4 py-2 pb-safe md:hidden">
  <div class="max-w-md mx-auto flex items-center justify-around">
    <a href="overview.html" data-nav="gov-overview" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
      <span class="material-symbols-outlined text-[22px]">dashboard</span>
      <span class="font-label-sm text-[10px]">Overview</span>
    </a>
    <a href="response_center.html" data-nav="gov-response" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
      <span class="material-symbols-outlined text-[22px]">emergency</span>
      <span class="font-label-sm text-[10px]">Response</span>
    </a>
    <a href="mobile_map.html" data-nav="gov-mobile-map" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
      <span class="material-symbols-outlined text-[22px]">map</span>
      <span class="font-label-sm text-[10px]">Live Map</span>
    </a>
    <a href="mobile_triage.html" data-nav="gov-triage" class="nav-item flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
      <span class="material-symbols-outlined text-[22px]">assignment_late</span>
      <span class="font-label-sm text-[10px]">Triage</span>
    </a>
    <a href="../login.html" class="flex flex-col items-center gap-1 text-on-surface-variant hover:text-error transition-colors">
      <span class="material-symbols-outlined text-[22px]">logout</span>
      <span class="font-label-sm text-[10px]">Logout</span>
    </a>
  </div>
</nav>

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

    // Hide all role navs by default
    document.querySelectorAll(".role-nav").forEach(el => el.classList.add("hidden"));

    let role = "citizen";
    if (path.includes("/government/")) {
      role = "government";
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

# 4. Wire links inside Stitch's built-in government desktop sidebars
def wire_government_builtin_aside(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Wire overview
    content = content.replace('data-path="overview" href="#"', 'data-path="overview" href="overview.html"')
    content = content.replace('data-path="live-map" href="#"', 'data-path="live-map" href="mobile_map.html"')
    content = content.replace('data-path="incidents" href="#"', 'data-path="incidents" href="response_center.html"')
    content = content.replace('data-path="response-center" href="#"', 'data-path="response-center" href="response_center.html"')
    content = content.replace('data-path="simulator" href="#"', 'data-path="simulator" href="simulator.html"')
    content = content.replace('data-path="infrastructure" href="#"', 'data-path="infrastructure" href="critical_assets.html"')
    content = content.replace('data-path="analytics" href="#"', 'data-path="analytics" href="critical_assets.html"')
    content = content.replace('data-path="historical-hotspots" href="#"', 'data-path="historical-hotspots" href="critical_assets.html"')
    content = content.replace('data-path="departments" href="#"', 'data-path="departments" href="overview.html"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wired builtin aside in: {os.path.basename(filepath)}")

gov_dir = os.path.join(FRONTEND_DIR, "government")
for f in os.listdir(gov_dir):
    if f.endswith('.html'):
        wire_government_builtin_aside(os.path.join(gov_dir, f))

