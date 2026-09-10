/**
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
    const path = window.location.pathname.replace(/\\/g, '/');
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
    const path = window.location.pathname.replace(/\\/g, '/');

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
