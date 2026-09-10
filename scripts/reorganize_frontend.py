import os
import shutil
import json

BASE_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz"
EXPORT_SCREENS = os.path.join(BASE_DIR, "frontend", "stitch_export", "screens")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Define target directories
DIRS = [
    os.path.join(FRONTEND_DIR, "shared"),
    os.path.join(FRONTEND_DIR, "shared", "assets"),
    os.path.join(FRONTEND_DIR, "data"),
    os.path.join(FRONTEND_DIR, "citizen"),
    os.path.join(FRONTEND_DIR, "government"),
    os.path.join(FRONTEND_DIR, "rescue"),
    os.path.join(FRONTEND_DIR, "docs"),
]

for d in DIRS:
    os.makedirs(d, exist_ok=True)

# Mapping from exported filename to new relative path
FILE_MAPPING = {
    "06_climateshield_login_role_preview.html": "login.html",
    "14_climateshield_shield_mark.svg": os.path.join("shared", "assets", "logo.svg"),
    "07_climateshield_60-second_judge_demo_storyboard.md": os.path.join("docs", "storyboard.md"),
    
    # Citizen
    "20_citizen_home_live_map.html": os.path.join("citizen", "home.html"),
    "04_citizen_real-time_alerts_feed.html": os.path.join("citizen", "alerts.html"),
    "12_citizen_flood_zone_hazard_sheet.html": os.path.join("citizen", "hazard_sheet.html"),
    "18_citizen_safe_route_selection.html": os.path.join("citizen", "route_selection.html"),
    "23_citizen_active_navigation_rerouting.html": os.path.join("citizen", "active_nav.html"),
    "10_citizen_emergency_assistance_sos.html": os.path.join("citizen", "sos.html"),
    "24_citizen_report_hazard_flow.html": os.path.join("citizen", "report.html"),
    
    # Government
    "08_government_command_center_overview.html": os.path.join("government", "overview.html"),
    "03_government_response_center_incident_management.html": os.path.join("government", "response_center.html"),
    "15_government_critical_asset_monitor.html": os.path.join("government", "critical_assets.html"),
    "09_government_disaster_simulator.html": os.path.join("government", "simulator.html"),
    "05_government_zone_detail_cascade_impact.html": os.path.join("government", "zone_detail.html"),
    "22_government_mobile_live_map_tactical_stack.html": os.path.join("government", "mobile_map.html"),
    "11_government_mobile_incident_triage_dispatch.html": os.path.join("government", "mobile_triage.html"),
    "01_government_mobile_field_tasks_deployment.html": os.path.join("government", "mobile_tasks.html"),
    
    # Rescue
    "21_rescue_home_live_tactical_map.html": os.path.join("rescue", "home.html"),
    "17_rescue_mission_detail_dossier.html": os.path.join("rescue", "mission_detail.html"),
    "16_rescue_active_mission_navigation.html": os.path.join("rescue", "active_nav.html"),
    "02_rescue_hazard_risk_detail.html": os.path.join("rescue", "hazard_detail.html"),
    "13_rescue_mission_status_update_reporting.html": os.path.join("rescue", "status_report.html"),
    "19_rescue_tablet_desktop_command_console.html": os.path.join("rescue", "command_console.html"),
}

for src_name, dest_rel in FILE_MAPPING.items():
    src_path = os.path.join(EXPORT_SCREENS, src_name)
    dest_path = os.path.join(FRONTEND_DIR, dest_rel)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        print(f"Copied {src_name} -> {dest_rel}")
    else:
        print(f"WARNING: Source {src_name} not found!")

# Also create index.html in frontend/
index_html_content = """<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=/login.html" />
  <script>window.location.href = "login.html";</script>
</head>
<body>
  <p>Redirecting to <a href="login.html">Login</a>...</p>
</body>
</html>
"""

with open(os.path.join(FRONTEND_DIR, "index.html"), 'w', encoding='utf-8') as f:
    f.write(index_html_content)

print("Created frontend/index.html redirect")
