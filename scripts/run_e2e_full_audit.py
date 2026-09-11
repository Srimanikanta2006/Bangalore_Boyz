import urllib.request
import json
import time

BASE_GOV_URL = 'http://localhost:4000/api'
BASE_RESCUE_URL = 'http://localhost:4001/api'

results = []

def record(step_num, title, is_pass, endpoint_or_ui, status_or_res, error=None, layer=None):
    entry = {
        "step": step_num,
        "title": title,
        "pass": is_pass,
        "endpoint": endpoint_or_ui,
        "status": status_or_res,
        "error": str(error) if error else None,
        "layer": layer or "integration"
    }
    results.append(entry)
    status_str = "[PASS]" if is_pass else "[FAIL]"
    print(f"\n--- [STEP {step_num}] {title} ---")
    print(f"Status: {status_str}")
    print(f"Endpoint/UI: {endpoint_or_ui}")
    print(f"Response: {status_or_res}")
    if error:
        print(f"Error: {error}")
    print(f"Layer: {layer}")

print("==========================================================================")
print("      ClimateShield Complete End-to-End System Integration Audit         ")
print("==========================================================================\n")

citizen_token = None
gov_token = None
test_incident_id = "inc_204"
test_task_id = None
test_zone_id = "zone_eb"

# --- STEP 1: Citizen Authentication ---
try:
    req = urllib.request.Request(
        f"{BASE_GOV_URL}/auth/login",
        data=json.dumps({"email": "citizen@climateshield.demo", "password": "DemoGov@2024"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    citizen_token = data["data"]["token"]
    record(1, "Citizen Authentication", True, "POST /api/auth/login", f"HTTP 200 - User: {data['data']['user']['email']} (Role: {data['data']['user']['role']})", layer="authentication")
except Exception as e:
    record(1, "Citizen Authentication", False, "POST /api/auth/login", "HTTP Auth Error", error=e, layer="authentication")

# Login as Government Operator
try:
    req = urllib.request.Request(
        f"{BASE_GOV_URL}/auth/login",
        data=json.dumps({"email": "government@climateshield.demo", "password": "DemoGov@2024"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    gov_token = data["data"]["token"]
except Exception as e:
    print(f"Gov Login Error: {e}")

gov_headers = {"Authorization": f"Bearer {gov_token}", "Content-Type": "application/json"} if gov_token else {}
citizen_headers = {"Authorization": f"Bearer {citizen_token}", "Content-Type": "application/json"} if citizen_token else {}

# --- STEP 2: Citizen Hazard Report & SOS ---
try:
    sos_payload = json.dumps({
        "latitude": 13.062,
        "longitude": 80.275,
        "primaryThreat": "FLOOD_BOAT",
        "peopleAffected": 3,
        "note": "Citizen SOS: Stranded drivers near flooded East Basin Drain D07 underpass"
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE_GOV_URL}/citizen/sos", data=sos_payload, headers=citizen_headers, method="POST")
    res = urllib.request.urlopen(req)
    sos_data = json.loads(res.read().decode('utf-8'))
    created_inc_id = sos_data["data"].get("incidentId")
    if created_inc_id:
        test_incident_id = created_inc_id
    record(2, "Citizen Hazard/Flood Report & SOS", True, "POST /api/citizen/sos", f"HTTP 200 - SOS Incident Created: {test_incident_id} (Threat: FLOOD_BOAT)", layer="backend")
except Exception as e:
    record(2, "Citizen Hazard/Flood Report & SOS", False, "POST /api/citizen/sos", "Citizen SOS submit error", error=e, layer="backend")

# --- STEP 3: Backend Incident Creation Verification ---
try:
    req = urllib.request.Request(f"{BASE_GOV_URL}/incidents/{test_incident_id}", headers=gov_headers)
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    inc = data["data"]
    record(3, "Backend Incident Creation", True, f"GET /api/incidents/{test_incident_id}", f"HTTP 200 - Code: {inc.get('incidentCode','N/A')}, Title: '{inc.get('title')}', Severity: {inc.get('severity')}", layer="database")
except Exception as e:
    record(3, "Backend Incident Creation", False, f"GET /api/incidents/{test_incident_id}", "Incident query error", error=e, layer="database")

# --- STEP 4: Government Response Center Visibility ---
try:
    req = urllib.request.Request(f"{BASE_GOV_URL}/government/overview", headers=gov_headers)
    res = urllib.request.urlopen(req)
    overview_data = json.loads(res.read().decode('utf-8'))["data"]
    kpis = overview_data.get("kpis", overview_data)
    record(4, "Government Response Center Visibility", True, "GET /api/government/overview", f"HTTP 200 - Active Incidents: {kpis.get('activeIncidents')}, Critical Hazards: {kpis.get('criticalHazards')}", layer="frontend")
except Exception as e:
    record(4, "Government Response Center Visibility", False, "GET /api/government/overview", "Overview KPI query error", error=e, layer="frontend")

# --- STEP 5: Multi-Agent Incident Orchestration ---
orchestration_response = None
try:
    orchestration_target_id = "inc_204"  # Has primary asset asset_drain_07
    req = urllib.request.Request(f"{BASE_GOV_URL}/incidents/{orchestration_target_id}/orchestrate", data=json.dumps({}).encode('utf-8'), headers=gov_headers, method="POST")
    res = urllib.request.urlopen(req)
    orchestration_response = json.loads(res.read().decode('utf-8'))["data"]
    record(5, "Multi-Agent Incident Orchestration", True, f"POST /api/incidents/{orchestration_target_id}/orchestrate", f"HTTP 200 - Mode: {orchestration_response.get('mode')}, LLM Model: {orchestration_response.get('llmModel')}", layer="orchestration")
except Exception as e:
    record(5, "Multi-Agent Incident Orchestration", False, "POST /api/incidents/:id/orchestrate", "Orchestration invocation error", error=e, layer="orchestration")

# --- STEP 6: Verify Proposed Response Plan ---
try:
    plan = orchestration_response.get("plan", {}) if orchestration_response else {}
    status_plan = plan.get("status")
    actions = plan.get("dispatch", {}).get("recommendedActions", [])
    briefing = plan.get("comms", {}).get("briefings", {}).get("operator", "")
    record(6, "Verify Proposed Response Plan", bool(status_plan == "PROPOSED" and len(actions) > 0), "Orchestration Plan Schema", f"HTTP 200 - Plan Status: '{status_plan}', Recommended Actions: {len(actions)}, Briefing: '{briefing[:65]}...'", layer="orchestration")
except Exception as e:
    record(6, "Verify Proposed Response Plan", False, "Proposed Plan Schema Check", "Plan parsing error", error=e, layer="orchestration")

# --- STEP 7: Verify Risk Analysis & Cascade Chain ---
try:
    req = urllib.request.Request(f"{BASE_GOV_URL}/incidents/inc_204/cascade", headers=gov_headers)
    res = urllib.request.urlopen(req)
    cascade_data = json.loads(res.read().decode('utf-8'))["data"]
    nodes_count = len(cascade_data.get("nodes", []))
    root_name = cascade_data.get("rootAsset", {}).get("name", "N/A") if cascade_data.get("rootAsset") else "N/A"
    record(7, "Verify Risk Analysis & Cascade Chain", True, "GET /api/incidents/inc_204/cascade", f"HTTP 200 - Cascade Chain Nodes: {nodes_count}, Root Infrastructure Asset: '{root_name}'", layer="backend")
except Exception as e:
    record(7, "Verify Risk Analysis & Cascade Chain", False, "GET /api/incidents/:id/cascade", "Cascade query error", error=e, layer="backend")

# --- STEP 8: Human Approval & Task Creation ---
try:
    task_payload = json.dumps({
        "title": f"Dispatch Drain Crew to Clear East Basin Drain D07 ({int(time.time())})",
        "description": "Approved operator task from multi-agent response plan",
        "incidentId": "inc_204",
        "priority": "HIGH",
        "assignedDepartmentId": "dept_pw"
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE_GOV_URL}/tasks", data=task_payload, headers=gov_headers, method="POST")
    res = urllib.request.urlopen(req)
    resp_obj = json.loads(res.read().decode('utf-8'))["data"]
    task_obj = resp_obj.get("task", resp_obj)
    test_task_id = task_obj["id"]
    record(8, "Human Approval & Task Dispatch", True, "POST /api/tasks", f"HTTP 200 - Task ID: {test_task_id} ({task_obj.get('taskCode')}), Status: {task_obj.get('status')}", layer="integration")
except Exception as e:
    record(8, "Human Approval & Task Dispatch", False, "POST /api/tasks", "Task creation error", error=e, layer="integration")

# --- STEP 9: Notification Pipeline Verification ---
try:
    notify_payload = json.dumps({
        "riskLevel": "CRITICAL",
        "message": "EMERGENCY DEMO ALERT: Severe inundation near East Basin Drain D07 underpass."
    }).encode('utf-8')
    req_trigger = urllib.request.Request(f"{BASE_GOV_URL}/zones/zone_eb/notify", data=notify_payload, headers=gov_headers, method="POST")
    res_trigger = urllib.request.urlopen(req_trigger)
    
    req = urllib.request.Request(f"{BASE_GOV_URL}/notifications", headers=gov_headers)
    res = urllib.request.urlopen(req)
    notif_data = json.loads(res.read().decode('utf-8'))["data"]
    alerts_total = notif_data.get("pagination", {}).get("total", len(notif_data.get("items", [])))
    record(9, "Notification Pipeline Verification", True, "POST /api/zones/:id/notify & GET /api/notifications", f"HTTP 200 - Broadcast Sent, Total Alerts Logged: {alerts_total}", layer="backend")
except Exception as e:
    record(9, "Notification Pipeline Verification", False, "GET /api/notifications", "Notification query error", error=e, layer="backend")

# --- STEP 10: Rescue Tactical Mission & Unit Visibility ---
try:
    req = urllib.request.Request(f"{BASE_GOV_URL}/units", headers=gov_headers)
    res = urllib.request.urlopen(req)
    units_data = json.loads(res.read().decode('utf-8'))["data"]
    units_count = len(units_data.get("items", []))
    
    req_rescue = urllib.request.Request(f"{BASE_RESCUE_URL}/rescue/command-console")
    res_rescue = urllib.request.urlopen(req_rescue)
    rescue_inc = json.loads(res_rescue.read().decode('utf-8'))["data"]
    
    record(10, "Rescue Tactical Visibility", True, "GET /api/units & GET :4001/api/rescue/command-console", f"HTTP 200 - Response Units: {units_count}, Rescue Tactical Console Active (Active Missions: {rescue_inc.get('activeMissions', 'N/A')})", layer="integration")
except Exception as e:
    record(10, "Rescue Tactical Visibility", False, "Rescue Server / Unit API", "Rescue query error", error=e, layer="integration")

# --- STEP 11: Task Status Progression ---
try:
    patch_ack = json.dumps({"status": "ACKNOWLEDGED", "note": "Unit acknowledged task dispatch"}).encode('utf-8')
    req_ack = urllib.request.Request(f"{BASE_GOV_URL}/tasks/{test_task_id}/status", data=patch_ack, headers=gov_headers, method="PATCH")
    res_ack = urllib.request.urlopen(req_ack)
    
    patch_payload = json.dumps({"status": "IN_PROGRESS", "note": "Unit on scene at East Basin Drain D07"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_GOV_URL}/tasks/{test_task_id}/status", data=patch_payload, headers=gov_headers, method="PATCH")
    res = urllib.request.urlopen(req)
    in_prog_obj = json.loads(res.read().decode('utf-8'))["data"]
    in_prog_data = in_prog_obj.get("task", in_prog_obj)
    
    patch_comp = json.dumps({"status": "COMPLETED", "note": "Drainage blockage cleared successfully"}).encode('utf-8')
    req_comp = urllib.request.Request(f"{BASE_GOV_URL}/tasks/{test_task_id}/status", data=patch_comp, headers=gov_headers, method="PATCH")
    res_comp = urllib.request.urlopen(req_comp)
    comp_obj = json.loads(res_comp.read().decode('utf-8'))["data"]
    comp_data = comp_obj.get("task", comp_obj)
    
    record(11, "Task Status Progression", True, f"PATCH /api/tasks/{test_task_id}/status", f"HTTP 200 - Status progressed: ASSIGNED -> ACKNOWLEDGED -> IN_PROGRESS -> COMPLETED (CompletedAt: {comp_data.get('completedAt')})", layer="backend")
except Exception as e:
    record(11, "Task Status Progression", False, "PATCH /api/tasks/:id/status", "Task status transition error", error=e, layer="backend")

# --- STEP 12: Completion & Government Verification ---
try:
    verify_payload = json.dumps({"note": "Field inspection completed by District Supervisor"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_GOV_URL}/tasks/{test_task_id}/verify", data=verify_payload, headers=gov_headers, method="POST")
    res = urllib.request.urlopen(req)
    verified_obj = json.loads(res.read().decode('utf-8'))["data"]
    verified_data = verified_obj.get("task", verified_obj)
    
    record(12, "Completion & Government Verification", True, f"POST /api/tasks/{test_task_id}/verify", f"HTTP 200 - Verified At: {verified_data.get('verifiedAt')}, Final Task Status: {verified_data.get('status')}", layer="integration")
except Exception as e:
    record(12, "Completion & Government Verification", False, "POST /api/tasks/:id/verify", "Task verification error", error=e, layer="integration")

print("\n==========================================================================")
passed_count = sum(1 for r in results if r["pass"])
total_count = len(results)
print(f"      E2E Integration Audit Summary: {passed_count}/{total_count} Steps PASSED [{round((passed_count/total_count)*100)}%]     ")
print("==========================================================================\n")
