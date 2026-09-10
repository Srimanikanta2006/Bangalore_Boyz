import urllib.request
import json
import sys

BASE_URL = "http://172.19.39.31:4000/api"

# 1. Login to retrieve dynamic JWT
login_data = json.dumps({"email": "government@climateshield.demo", "password": "DemoGov@2024"}).encode("utf-8")
login_req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(login_req, timeout=5) as res:
        login_resp = json.loads(res.read().decode("utf-8"))
        token = login_resp.get("data", {}).get("token") or login_resp.get("token")
        print(f"[OK] Auth Login Success! Token acquired (len={len(token) if token else 0})")
except Exception as e:
    print(f"[FAIL] Auth Login Failed: {e}")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

endpoints = [
    ("/government/overview", "Government Overview KPIs"),
    ("/incidents", "Active Incident Management"),
    ("/tasks", "Field Task Operations"),
    ("/units", "Tactical Field Response Units"),
    ("/infrastructure", "Critical Asset Infrastructure"),
    ("/zones", "Monitored Municipal Zones"),
    ("/hotspots", "Historical Climate Hotspots"),
    ("/departments", "Inter-Agency Department Readiness"),
    ("/analytics/overview", "Executive Resilience Analytics"),
    ("/map/overlays", "Geospatial Tactical Map Overlays")
]

print("\n=======================================================")
print(" VERIFYING REAL BACKEND DATA FROM http://172.19.39.31:4000/api")
print("=======================================================\n")

for path, label in endpoints:
    try:
        req = urllib.request.Request(f"{BASE_URL}{path}", headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            print(f"=== {label} ({path}) ===")
            print(f"Status: HTTP 200 OK")
            print(f"Data Payload Sample: {json.dumps(data, indent=2)[:350]}...")
            print("-------------------------------------------------------\n")
    except Exception as e:
        print(f"[FAIL] Failed to fetch {path}: {e}\n")
