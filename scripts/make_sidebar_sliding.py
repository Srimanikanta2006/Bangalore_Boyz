import os
import re

BASE_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz"
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
STITCH_EXPORT_DIR = os.path.join(FRONTEND_DIR, "stitch_export", "screens")

# 1. Restore response_center.html from original stitch export
orig_response_center = os.path.join(STITCH_EXPORT_DIR, "03_government_response_center_incident_management.html")
target_response_center = os.path.join(FRONTEND_DIR, "government", "response_center.html")

with open(orig_response_center, 'r', encoding='utf-8') as f:
    rc_content = f.read()

# Add script/css injections into head
rc_content = rc_content.replace("</head>", """
<script src="../shared/config.js"></script>
<link rel="stylesheet" href="../shared/app.css" />
<script src="../shared/app.js" defer></script>
</head>""")

# Add app-nav before body
rc_content = rc_content.replace("</body>", '\n<div id="app-nav"></div>\n</body>')

with open(target_response_center, 'w', encoding='utf-8') as f:
    f.write(rc_content)

print("Restored response_center.html from pristine export")

# 2. Update frontend/shared/app.css with Sliding Sidebar & Main Content Drawer transitions
app_css_content = """/* ClimateShield Shared Shell & Component Extensions */

/* Active Link Styling */
.nav-item.active {
  color: var(--color-primary, #0051d5) !important;
  font-weight: 700;
}

/* Ensure no horizontal scrollbars */
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* Sliding Sidebar & Main Content Transition */
aside.gov-sidebar {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  z-index: 50 !important;
}

aside.gov-sidebar.collapsed {
  transform: translateX(-100%) !important;
}

.gov-main-container {
  transition: padding-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.gov-main-container.sidebar-collapsed {
  padding-left: 0 !important;
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

# 3. Update frontend/shared/app.js with sidebar toggle handler
app_js_content = """/**
 * ClimateShield Application Core Engine
 * Handles navigation partial injection, sliding sidebar drawer toggle,
 * relative path resolution, data binding, and in-page modal/sheet toggles.
 */

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    initShell();
    initDataBinding();
    initInteractivity();
    initSidebarToggle();
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

  function initSidebarToggle() {
    // Add event listener for sidebar toggle buttons [☰]
    document.body.addEventListener("click", function (e) {
      const toggleBtn = e.target.closest("[data-action='toggle-sidebar']");
      if (toggleBtn) {
        e.preventDefault();
        const sidebar = document.querySelector("aside.gov-sidebar") || document.querySelector("aside");
        const container = document.querySelector(".gov-main-container") || document.querySelector(".pl-64");

        if (sidebar) {
          sidebar.classList.toggle("collapsed");
        }
        if (container) {
          container.classList.toggle("sidebar-collapsed");
        }
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

# 4. Enhance all government desktop screens with classes and [☰] sidebar toggle button
gov_dir = os.path.join(FRONTEND_DIR, "government")

def process_gov_screen(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add gov-sidebar class to <aside>
    content = content.replace('<aside class="fixed left-0 top-14 bottom-0 w-64', '<aside class="gov-sidebar fixed left-0 top-14 bottom-0 w-64')

    # Add gov-main-container class to <div class="pl-64">
    content = content.replace('<div class="pl-64">', '<div class="gov-main-container pl-64">')

    # Add sidebar toggle button [☰] into header if not present
    if 'data-action="toggle-sidebar"' not in content:
        toggle_btn_html = '<button data-action="toggle-sidebar" class="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center mr-1" type="button" title="Toggle Command Sidebar"><span class="material-symbols-outlined text-[22px]">menu</span></button>'
        content = content.replace('<div class="flex items-center gap-space-md">', f'<div class="flex items-center gap-space-md">{toggle_btn_html}', 1)

    # Wire links inside builtin sidebar
    content = content.replace('data-path="overview" href="#"', 'data-path="overview" href="overview.html"')
    content = content.replace('data-path="live-map" href="#"', 'data-path="live-map" href="mobile_map.html"')
    content = content.replace('data-path="incidents" href="#"', 'data-path="incidents" href="response_center.html"')
    content = content.replace('data-path="response-center" href="#"', 'data-path="response-center" href="response_center.html"')
    content = content.replace('data-path="simulator" href="#"', 'data-path="simulator" href="simulator.html"')
    content = content.replace('data-path="infrastructure" href="#"', 'data-path="infrastructure" href="critical_assets.html"')
    content = content.replace('data-path="analytics" href="#"', 'data-path="analytics" href="critical_assets.html"')
    content = content.replace('data-path="historical-hotspots" href="#"', 'data-path="historical-hotspots" href="critical_assets.html"')
    content = content.replace('data-path="departments" href="#"', 'data-path="departments" href="overview.html"')

    # Wire dispatch team button inside incident cards properly
    content = re.sub(
        r'(<button[^>]*class="[^"]*bg-primary[^"]*"[^>]*>\s*<span[^>]*>send</span>\s*<span>Dispatch Team</span>\s*</button>)',
        r'<button data-action="dispatch-team" class="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-md font-bold flex items-center gap-1.5 shadow hover:bg-slate-800 transition-colors"><span class="material-symbols-outlined text-[18px]">send</span><span>Dispatch Team</span></button>',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Enhanced sliding sidebar in: {os.path.basename(filepath)}")

for f in os.listdir(gov_dir):
    if f.endswith('.html'):
        process_gov_screen(os.path.join(gov_dir, f))

