import os
import re

FRONTEND_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz\frontend"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Ensure shared css & js in head
    if "</head>" in content and "/shared/app.css" not in content:
        head_injections = """
<script src="/shared/config.js"></script>
<link rel="stylesheet" href="/shared/app.css" />
<script src="/shared/app.js" defer></script>
</head>"""
        content = content.replace("</head>", head_injections, 1)
        modified = True

    # 2. Ensure nav placeholder before </body>
    if "</body>" in content and '<div id="app-nav"></div>' not in content:
        content = content.replace("</body>", '\n<div id="app-nav"></div>\n</body>', 1)
        modified = True

    # 3. Add explicit click-path links if not already present
    
    # login.html
    if "login.html" in filepath:
        # Wrap role cards in clickable anchors or add direct links
        content = content.replace('data-role="citizen"', 'data-role="citizen" onclick="window.location.href=\'/citizen/home.html\'"')
        content = content.replace('data-role="government"', 'data-role="government" onclick="window.location.href=\'/government/overview.html\'"')
        content = content.replace('data-role="rescue"', 'data-role="rescue" onclick="window.location.href=\'/rescue/home.html\'"')
        # Primary Sign In button
        content = re.sub(
            r'(<button[^>]*>.*?Verify &amp; Sign In.*?</button>)',
            r'<a href="/citizen/home.html" class="w-full h-10 mt-1 rounded-lg bg-primary text-on-primary font-body-md font-semibold flex items-center justify-center gap-1.5 shadow-md hover:bg-slate-800 transition-colors"><span class="material-symbols-outlined text-[18px]">login</span><span>Launch Citizen Demo</span></a>',
            content,
            flags=re.DOTALL
        )
        modified = True

    # citizen/home.html
    elif os.path.normpath(filepath).endswith(os.path.normpath("citizen/home.html")):
        # Search bar / Evacuation route button -> route_selection.html
        content = content.replace('placeholder="Search shelter, hazard zone, or route..."', 'placeholder="Search shelter, hazard zone, or route..." onclick="window.location.href=\'/citizen/route_selection.html\'"')
        content = content.replace('Route Options', '<a href="/citizen/route_selection.html" class="text-secondary font-semibold hover:underline">Route Options →</a>')
        modified = True

    # citizen/route_selection.html
    elif os.path.normpath(filepath).endswith(os.path.normpath("citizen/route_selection.html")):
        # Start Navigation -> active_nav.html
        content = re.sub(
            r'(<button[^>]*>.*?Start Navigation.*?</button>)',
            r'<a href="/citizen/active_nav.html" class="w-full h-12 rounded-xl bg-primary text-on-primary font-body-md font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-all"><span class="material-symbols-outlined text-[20px]">navigation</span><span>Start Navigation</span></a>',
            content,
            flags=re.DOTALL
        )
        modified = True

    # citizen/active_nav.html
    elif os.path.normpath(filepath).endswith(os.path.normpath("citizen/active_nav.html")):
        # Flood hazard sheet link
        content = content.replace('View Flood Sheet', '<a href="/citizen/hazard_sheet.html" class="text-secondary font-semibold hover:underline">View Flood Sheet</a>')
        modified = True

    # government/overview.html
    elif os.path.normpath(filepath).endswith(os.path.normpath("government/overview.html")):
        # Response Center link
        content = content.replace('Response Center', '<a href="/government/response_center.html" class="hover:underline">Response Center</a>')
        # Zone detail link
        content = content.replace('Zone Detail', '<a href="/government/zone_detail.html" class="hover:underline">Zone Detail</a>')
        modified = True

    # government/response_center.html
    elif os.path.normpath(filepath).endswith(os.path.normpath("government/response_center.html")):
        # Add data-action="dispatch-team" to dispatch buttons
        content = re.sub(
            r'(<button[^>]*>.*?Dispatch.*?</button>)',
            r'<button data-action="dispatch-team" class="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-md font-bold flex items-center gap-1.5 shadow hover:bg-slate-800 transition-colors"><span class="material-symbols-outlined text-[18px]">send</span><span>Dispatch Team</span></button>',
            content,
            flags=re.DOTALL
        )
        modified = True

    # rescue/mission_detail.html
    elif os.path.normpath(filepath).endswith(os.path.normpath("rescue/mission_detail.html")):
        # Start Mission -> rescue/active_nav.html
        content = re.sub(
            r'(<button[^>]*>.*?Start Mission.*?</button>)',
            r'<a href="/rescue/active_nav.html" class="w-full h-12 rounded-xl bg-secondary text-on-secondary font-body-md font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><span class="material-symbols-outlined text-[20px]">navigation</span><span>Start Active Navigation</span></a>',
            content,
            flags=re.DOTALL
        )
        modified = True

    # rescue/active_nav.html
    elif os.path.normpath(filepath).endswith(os.path.normpath("rescue/active_nav.html")):
        # Submit update -> status_report.html
        content = content.replace('Submit Status', '<a href="/rescue/status_report.html" class="w-full h-10 rounded-lg bg-primary text-on-primary font-body-md font-semibold flex items-center justify-center gap-1">Submit Status Update</a>')
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Wired: {os.path.relpath(filepath, FRONTEND_DIR)}")

def walk_and_wire(dirpath):
    for root, _, files in os.walk(dirpath):
        for f in files:
            if f.endswith('.html'):
                process_file(os.path.join(root, f))

walk_and_wire(FRONTEND_DIR)
