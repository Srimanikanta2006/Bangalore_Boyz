import urllib.request
import json
import sys

BASE_URL = "http://172.19.39.31:4000/api"

print("======================================================================")
print("   CLIMATESHIELD - COMPLETE 30+ ENDPOINT INTEGRATION VERIFICATION")
print("======================================================================\n")

# 1. Login
login_payload = json.dumps({"email": "government@climateshield.demo", "password": "DemoGov@2024"}).encode("utf-8")
login_req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_payload, headers={"Content-Type": "application/json"})

token = None
try:
    with urllib.request.urlopen(login_req, timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))
        token = data.get("data", {}).get("token") or data.get("token")
        print(f"[PASS] Auth Login (POST /auth/login) - Token Length: {len(token)}")
except Exception as e:
    print(f"[FAIL] Auth Login Failed: {e}")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

results = []

def call_endpoint(method, path, body=None, label=""):
    url = f"{BASE_URL}{path}"
    data_bytes = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            status = res.status
            resp = res.read().decode("utf-8")
            results.append((label or f"{method} {path}", status, "PASS", resp[:120]))
            print(f"[PASS] {method} {path} (HTTP {status})")
    except urllib.error.HTTPError as e:
        results.append((label or f"{method} {path}", e.code, "FAIL", e.read().decode("utf-8")[:120]))
        print(f"[FAIL] {method} {path} (HTTP {e.code})")
    except Exception as e:
        results.append((label or f"{method} {path}", 500, "ERROR", str(e)[:120]))
        print(f"[ERROR] {method} {path} ({e})")

# Test Endpoints List
print("\n--- 1. Core & Auth ---")
call_endpoint("GET", "/health", label="Health Check")
call_endpoint("GET", "/auth/me", label="Get Current User")

print("\n--- 2. Government Overview & Response Center ---")
call_endpoint("GET", "/government/overview", label="Government Overview")
call_endpoint("GET", "/response-center", label="Response Center Overview")

print("\n--- 3. Incidents API ---")
call_endpoint("GET", "/incidents", label="List Incidents")
call_endpoint("GET", "/incidents/inc_204", label="Get Incident by ID")
call_endpoint("GET", "/incidents/inc_204/cascade", label="Get Incident Cascade")

print("\n--- 4. Tasks API ---")
call_endpoint("GET", "/tasks", label="List Tasks")
call_endpoint("POST", "/tasks", body={"title": "Verification Task", "description": "Auto verification test", "priority": "MEDIUM"}, label="Create Task")
call_endpoint("GET", "/tasks/task_002", label="Get Task by ID")

print("\n--- 5. Response Units API ---")
call_endpoint("GET", "/units", label="List Units")
call_endpoint("GET", "/units/unit_command_1", label="Get Unit by ID")

print("\n--- 6. Infrastructure API ---")
call_endpoint("GET", "/infrastructure", label="List Infrastructure")
call_endpoint("GET", "/infrastructure/asset_brg_02", label="Get Infrastructure Asset")
call_endpoint("GET", "/infrastructure/asset_brg_02/telemetry", label="Get Asset Telemetry")
call_endpoint("GET", "/infrastructure/asset_brg_02/risk", label="Get Asset Risk")
call_endpoint("GET", "/infrastructure/asset_brg_02/dependencies", label="Get Asset Dependencies")

print("\n--- 7. Zones & Cascades API ---")
call_endpoint("GET", "/zones", label="List Zones")
call_endpoint("GET", "/zones/zone_eb", label="Get Zone by ID")
call_endpoint("GET", "/zones/zone_eb/cascade", label="Get Zone Cascade")

print("\n--- 8. Hazards API ---")
call_endpoint("GET", "/hazards", label="List Hazards")
call_endpoint("GET", "/hazards/hz_ff_eb", label="Get Hazard by ID")

print("\n--- 9. Geospatial Map Engine (GeoJSON) ---")
call_endpoint("GET", "/map/assets", label="Map Assets")
call_endpoint("GET", "/map/hazards", label="Map Hazards")
call_endpoint("GET", "/map/incidents", label="Map Incidents")
call_endpoint("GET", "/map/units", label="Map Units")
call_endpoint("GET", "/map/overlays", label="Map Overlays")

print("\n--- 10. Analytics & Hotspots ---")
call_endpoint("GET", "/analytics/overview", label="Analytics Overview")
call_endpoint("GET", "/hotspots", label="List Hotspots")

print("\n--- 11. Departments API ---")
call_endpoint("GET", "/departments", label="List Departments")
call_endpoint("GET", "/departments/dept_em", label="Get Department by ID")

print("\n======================================================================")
passed = sum(1 for r in results if r[2] == "PASS")
print(f"   VERIFICATION SUMMARY: {passed} / {len(results)} Endpoints Passed [PASS]")
print("======================================================================\n")
