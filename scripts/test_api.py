"""
ClimateShield Quick API CLI Runner
Usage:
  python scripts/test_api.py GET /government/overview
  python scripts/test_api.py GET /incidents
  python scripts/test_api.py POST /tasks '{"title":"Deploy Emergency Pump","description":"Pumping water at D07","priority":"HIGH"}'
"""

import sys
import json
import urllib.request

BASE_URL = "http://172.19.39.31:4000/api"

def get_token():
    payload = json.dumps({"email": "government@climateshield.demo", "password": "DemoGov@2024"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))
        return data.get("data", {}).get("token") or data.get("token")

def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/test_api.py <GET|POST|PATCH|DELETE> <endpoint> [json_body]")
        print("Example: python scripts/test_api.py GET /government/overview")
        print("Example: python scripts/test_api.py POST /tasks '{\"title\":\"Dispatch Crew\"}'")
        sys.exit(1)

    method = sys.argv[1].upper()
    endpoint = sys.argv[2]
    if not endpoint.startswith("/"):
        endpoint = "/" + endpoint

    body_raw = sys.argv[3] if len(sys.argv) > 3 else None

    print(f"Logging in to {BASE_URL}...")
    token = get_token()
    print(f"Token acquired. Executing {method} {endpoint}...\n")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    data_bytes = body_raw.encode("utf-8") if body_raw else None
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", data=data_bytes, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            resp_body = res.read().decode("utf-8")
            print(f"=== RESPONSE (HTTP {res.status}) ===")
            try:
                print(json.dumps(json.loads(resp_body), indent=2))
            except Exception:
                print(resp_body)
    except urllib.error.HTTPError as e:
        print(f"=== HTTP ERROR {e.code} ===")
        print(e.read().decode("utf-8"))
    except Exception as e:
        print(f"=== ERROR ===\n{e}")

if __name__ == "__main__":
    main()
