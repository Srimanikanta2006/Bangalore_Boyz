import urllib.request
import json
import sys

RESCUE_BASE_URL = "http://localhost:4001/api"
GOV_BASE_URL = "http://172.19.39.31:4000/api"

print("======================================================================")
print("   CLIMATESHIELD - DUAL BACKEND VERIFICATION (RESCUE PORT 4001)")
print("======================================================================\n")

# 1. Login to Rescue Server (Port 4001)
login_payload = json.dumps({"email": "rescue.tactical@climateshield.org", "password": "DemoRescue@2024"}).encode("utf-8")
login_req = urllib.request.Request(f"{RESCUE_BASE_URL}/auth/login", data=login_payload, headers={"Content-Type": "application/json"})

token = None
try:
    with urllib.request.urlopen(login_req, timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))
        token = data.get("data", {}).get("token") or data.get("token")
        print(f"[PASS] Rescue Auth Login (POST {RESCUE_BASE_URL}/auth/login) - Token Acquired (len={len(token)})")
except Exception as e:
    print(f"[FAIL] Rescue Auth Login Failed: {e}")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

results = []

def call_endpoint(method, path, body=None, label="", base_url=RESCUE_BASE_URL):
    url = f"{base_url}{path}"
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

print("\n--- Rescue Backend Engine (Port 4001) ---")
call_endpoint("GET", "/health", label="Rescue Health Check")
call_endpoint("GET", "/rescue/missions", label="Rescue List Missions")
call_endpoint("GET", "/rescue/missions/MSN-402", label="Rescue Get Mission & AI Dossier")
call_endpoint("POST", "/rescue/missions/MSN-402/status", body={"status": "IN_PROGRESS", "notes": "Pump online at checkpoint"}, label="Rescue Submit Mission Status")
call_endpoint("GET", "/rescue/navigation/MSN-402", label="Rescue Get Tactical Navigation")
call_endpoint("GET", "/rescue/command-console", label="Rescue Get Command Console Feed")
call_endpoint("GET", "/rescue/units", label="Rescue Get Tactical Units Roster")

print("\n======================================================================")
passed = sum(1 for r in results if r[2] == "PASS")
print(f"   VERIFICATION SUMMARY: {passed} / {len(results)} Rescue Endpoints Passed [PASS]")
print("======================================================================\n")
