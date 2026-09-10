import json
import os
import urllib.request
import re

STEPS_PROJECT_OUTPUT = r"C:\Users\nidhi\.gemini\antigravity-ide\brain\0392680b-3f0a-4982-835f-b8b2ad38c09b\.system_generated\steps\9\output.txt"
STEPS_SCREENS_OUTPUT = r"C:\Users\nidhi\.gemini\antigravity-ide\brain\0392680b-3f0a-4982-835f-b8b2ad38c09b\.system_generated\steps\21\output.txt"

EXPORT_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz\frontend\stitch_export"
SCREENS_DIR = os.path.join(EXPORT_DIR, "screens")

os.makedirs(SCREENS_DIR, exist_ok=True)

# 1. Extract Project Metadata & Design System
with open(STEPS_PROJECT_OUTPUT, 'r', encoding='utf-8') as f:
    project_data = json.load(f)

project = project_data["projects"][0]
design_md = project.get("designTheme", {}).get("designMd", "")

with open(os.path.join(EXPORT_DIR, "DESIGN_SYSTEM.md"), 'w', encoding='utf-8') as f:
    f.write(design_md)

print("Saved DESIGN_SYSTEM.md")

# 2. Extract Screens
with open(STEPS_SCREENS_OUTPUT, 'r', encoding='utf-8') as f:
    screens_data = json.load(f)

screens = screens_data.get("screens", [])

def sanitize_filename(title, mime_type):
    ext = ".html"
    if "svg" in mime_type:
        ext = ".svg"
    elif "markdown" in mime_type:
        ext = ".md"
    
    clean = re.sub(r'[^a-zA-Z0-9_\- ]', '', title).strip()
    clean = re.sub(r'\s+', '_', clean).lower()
    return clean + ext

downloaded_info = []

for idx, screen in enumerate(screens, 1):
    title = screen.get("title", f"screen_{idx}")
    html_code = screen.get("htmlCode", {})
    download_url = html_code.get("downloadUrl", "")
    mime_type = html_code.get("mimeType", "text/html")
    
    filename = f"{idx:02d}_{sanitize_filename(title, mime_type)}"
    filepath = os.path.join(SCREENS_DIR, filename)
    
    print(f"[{idx}/{len(screens)}] Downloading '{title}' -> {filename}...")
    
    if download_url:
        req = urllib.request.Request(
            download_url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                content = resp.read().decode('utf-8')
                with open(filepath, 'w', encoding='utf-8') as sf:
                    sf.write(content)
                print(f"  Success ({len(content)} bytes)")
        except Exception as e:
            print(f"  Failed to download {download_url}: {e}")
    else:
        print(f"  No downloadUrl found for screen {title}")

    downloaded_info.append({
        "index": idx,
        "screen_id": screen.get("name"),
        "title": title,
        "device_type": screen.get("deviceType"),
        "width": screen.get("width"),
        "height": screen.get("height"),
        "filename": filename,
        "mime_type": mime_type,
        "screenshot_url": screen.get("screenshot", {}).get("downloadUrl", "")
    })

# Save Project Metadata JSON
metadata = {
    "project": {
        "id": project.get("name"),
        "title": project.get("title"),
        "project_type": project.get("projectType"),
        "device_type": project.get("deviceType"),
        "create_time": project.get("createTime"),
        "update_time": project.get("updateTime"),
        "design_theme": {
            "color_mode": project.get("designTheme", {}).get("colorMode"),
            "font": project.get("designTheme", {}).get("font"),
            "named_colors": project.get("designTheme", {}).get("namedColors"),
        }
    },
    "screens_count": len(downloaded_info),
    "screens": downloaded_info
}

with open(os.path.join(EXPORT_DIR, "project_metadata.json"), 'w', encoding='utf-8') as f:
    json.dump(metadata, f, indent=2)

print("Saved project_metadata.json")

# 3. Create README.md for Stitch Export
readme_content = f"""# Stitch Project Export: {project.get('title')}

Extracted directly via **StitchMCP** integration on `{project.get('updateTime')}`.

## Project Details
- **Project Name**: {project.get('title')}
- **Project ID**: `{project.get('name')}`
- **Device Type**: {project.get('deviceType')}
- **Project Type**: {project.get('projectType')}
- **Total Screens Extracted**: {len(downloaded_info)}

---

## Design System Summary
- **Primary Color**: `#0f172a`
- **Secondary Color**: `#0051d5` (Severity / Active markers)
- **Background**: `#f8f9ff`
- **Fonts**: `Plus Jakarta Sans` (Headings) & `Manrope` (Body/Data)
- Detailed specification available in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## Extracted Screens List

| # | Screen Title | Device | Format | File |
|---|--------------|--------|--------|------|
"""

for s in downloaded_info:
    readme_content += f"| {s['index']} | {s['title']} | {s['device_type']} | {s['mime_type']} | [`screens/{s['filename']}`](./screens/{s['filename']}) |\n"

with open(os.path.join(EXPORT_DIR, "README.md"), 'w', encoding='utf-8') as f:
    f.write(readme_content)

print("Saved README.md for stitch_export")
