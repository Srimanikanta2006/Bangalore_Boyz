import urllib.request
import json
import sys

BASE_URL = "http://172.19.39.31:4000/api"

print("======================================================================")
print("   CLIMATESHIELD - RESCUE & CITIZEN ENDPOINTS INTEGRATION VERIFICATION")
print("======================================================================\n")

# 1. Login
login_payload = json.dumps({"email": "government@climateshield.demo", "password": "DemoGov@2024"}).encode("utf-8")
login_req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_payload, headers={"Content-Type": "application/json"})

token = None
try:
    with urllib.request.urlopen(login_req, timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))
        token = data.get("data", {}).get("token") or data.get("token")
        print(f"[PASS] Auth Login - Token Length: {len(token)}")
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

print("\n--- 1. Rescue Role Endpoints ---")
call_endpoint("GET", "/rescue/missions", label="Rescue List Missions")
call_endpoint("GET", "/rescue/missions/MSN-402", label="Rescue Get Mission Detail")
call_endpoint("POST", "/rescue/missions/MSN-402/status", body={"status": "IN_PROGRESS", "notes": "Pump online"}, label="Rescue Submit Mission Status")
call_endpoint("GET", "/rescue/navigation/MSN-402", label="Rescue Get Tactical Navigation")
call_endpoint("GET", "/rescue/command-console", label="Rescue Get Command Console Feed")

print("\n--- 2. Citizen Role Endpoints ---")
call_endpoint("GET", "/citizen/alerts", label="Citizen List Alerts")
call_endpoint("GET", "/citizen/home", label="Citizen Home Summary")
call_endpoint("POST", "/citizen/routes/search", body={"origin": "Sector 04-A", "destination": "Hospital Shelter"}, label="Citizen Search Safe Routes")
call_endpoint("POST", "/citizen/sos", body={"emergencyType": "FLOOD_TRAPPED", "peopleCount": 2}, label="Citizen Send Emergency SOS")
call_endpoint("POST", "/citizen/report", body={"hazardCategory": "WATERLOGGING", "description": "Sidewalk submerged"}, label="Citizen Submit Hazard Report")

print("\n======================================================================")
passed = sum(1 for r in results if r[2] == "PASS")
print(f"   VERIFICATION SUMMARY: {passed} / {len(results)} Rescue & Citizen Endpoints Passed [PASS]")
print("======================================================================\n")
