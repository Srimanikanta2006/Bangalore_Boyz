import glob
import re

def process_directory(directory, service_script_name):
    files = glob.glob(f"{directory}/*.html")
    
    script_tags = f"""<script src="../shared/config.js"></script>
<script src="../services/api.js"></script>
<script src="../services/{service_script_name}"></script>
<script src="../services/adapters.js"></script>
<link rel="stylesheet" href="../shared/app.css" />
<script src="../shared/app.js" defer></script>"""

    for filepath in files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        if f"services/{service_script_name}" in content:
            print(f"Skipping {filepath}, already injected.")
            continue

        pattern = r'<script src="(?:\.\./|/)shared/config\.js"></script>.*?<script src="(?:\.\./|/)shared/app\.js" defer></script>'

        if re.search(pattern, content, flags=re.DOTALL):
            new_content = re.sub(pattern, script_tags, content, flags=re.DOTALL)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {filepath}")
        else:
            new_content = content.replace("</head>", f"{script_tags}\n</head>")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Fallback updated {filepath}")

print("--- Injecting Rescue Service Scripts ---")
process_directory("frontend/rescue", "rescueApi.js")

print("\n--- Injecting Citizen Service Scripts ---")
process_directory("frontend/citizen", "citizenApi.js")
