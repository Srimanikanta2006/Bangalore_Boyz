import glob
import re

gov_files = glob.glob("frontend/government/*.html")

script_tags = """<script src="../shared/config.js"></script>
<script src="../services/api.js"></script>
<script src="../services/governmentApi.js"></script>
<script src="../services/adapters.js"></script>
<link rel="stylesheet" href="../shared/app.css" />
<script src="../shared/app.js" defer></script>"""

for filepath in gov_files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if api.js is already present
    if "services/api.js" in content:
        print(f"Skipping {filepath}, already injected.")
        continue

    # Pattern to match existing config/app scripts in head
    pattern = r'<script src="(?:\.\./|/)shared/config\.js"></script>.*?<script src="(?:\.\./|/)shared/app\.js" defer></script>'
    
    if re.search(pattern, content, flags=re.DOTALL):
        new_content = re.sub(pattern, script_tags, content, flags=re.DOTALL)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        # Fallback: insert before </head>
        new_content = content.replace("</head>", f"{script_tags}\n</head>")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Fallback updated {filepath}")
