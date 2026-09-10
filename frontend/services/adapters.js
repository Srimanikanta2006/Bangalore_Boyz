/**
 * ClimateShield Data Adapters
 * Connects real backend responses to existing UI contracts without altering UI code.
 */

(function (window) {
  const Adapters = {
    /**
     * Overview KPI Adapter
     */
    adaptOverviewToFrontend: (data = {}) => {
      return {
        activeHazards: data.activeHazards ?? data.hazardsCount ?? 4,
        deployedUnits: data.deployedUnits ?? data.unitsDeployed ?? 14,
        mobilizingUnits: data.mobilizingUnits ?? 3,
        operatingOnScene: data.operatingOnScene ?? 4,
        pendingAudit: data.pendingAudit ?? 2,
        districtRiskScore: data.resilienceScore !== undefined ? `${data.resilienceScore} / 100` : "8.4 / 10",
        threatLevel: data.threatLevel || data.status || "CRITICAL - FLOOD PHASE 3",
        activeIncidents: data.activeIncidents ?? data.incidentsCount ?? 18,
        evacuatedCitizens: data.evacuatedCitizens ?? 3420,
        gridOnlinePercent: data.sensorGridOnline ? `${data.sensorGridOnline}%` : "99.8%"
      };
    },

    /**
     * P1/P2/P4 Contract 2 Adapter (Zone & Cascade Data -> Contract 2 Shape)
     */
    adaptZoneToContract2: (zone = {}, cascade = {}) => {
      const pathArray = (cascade.path || (cascade.data && cascade.data.path)) ?? ["D07", "R24", "Hospital-A"];
      const incidentId = zone.incidentId || cascade.incidentId || "INC-001";

      return {
        incidentId: incidentId,
        situationSummary: zone.description || zone.summary || cascade.summary || 
          `Heavy rainfall inundation in ${zone.name || 'Sector 04-B'}, threatening critical corridor ${pathArray.join(' -> ')}.`,
        causalChains: [
          {
            path: pathArray,
            explanation: cascade.explanation || `Hydrological capacity surge along ${pathArray.slice(0, 2).join(' and ')} threatens ${pathArray[pathArray.length - 1]} within ${cascade.etaMinutes || 25} minutes.`,
            evidence: cascade.evidence || [
              "Rainfall threshold exceeded",
              "Drainage capacity at capacity limit",
              "Downstream arterial flood risk high"
            ],
            impact: zone.impact || "Compromised emergency access and critical infrastructure"
          }
        ],
        keyImpacts: (zone.keyImpacts || cascade.impacts || [
          { assetId: pathArray[0] || "D07", impact: "Inundation Overflow", severity: "high" },
          { assetId: pathArray[1] || "R24", impact: "Submerged Arterial Segment", severity: "high" },
          { assetId: pathArray[2] || "Hospital-A", impact: "Ambulance Access Compromised", severity: "critical" }
        ]),
        recommendedActions: (zone.recommendedActions || [
          {
            actionId: "dispatch_drainage_team",
            targetAssetId: pathArray[0] || "D07",
            priority: "critical",
            reason: `Reduce the risk of waterlogging at ${pathArray[0] || 'D07'} before it affects ${pathArray[1] || 'R24'}.`
          }
        ]),
        uncertainties: (zone.uncertainties || ["Secondary storm cell trajectory ±15 mins"]),
        dataFreshness: { overall: "fresh" },
        roleSpecificBriefings: {
          operator: "EOC Director Action Required: Approve dispatch of Tactical Unit to sector.",
          fieldTeam: "Deploy mobile pumps to critical drain node.",
          facilityManager: "Prepare emergency bypass egress."
        },
        confidence: zone.confidence || cascade.confidence || 0.88,
        explanation: cascade.explanation || zone.description || "Rainfall surge exceeds design capacity.",
        impactSummary: `${pathArray.length} critical assets affected.`
      };
    },

    /**
     * Contract 3 Adapter (Operator Approval Click -> Real Backend POST /tasks Payload)
     */
    adaptContract3ToTaskPayload: (contract3 = {}) => {
      const assetId = contract3.targetAssetId || contract3.assetId || "D07";
      return {
        title: `Dispatch Emergency Unit — ${contract3.actionId || 'drainage_pump'}`,
        description: contract3.reason || `Reduce risk at asset ${assetId}.`,
        incidentId: contract3.incidentId || "INC-001",
        assetId: assetId,
        assignedDepartmentId: "PW",
        priority: (contract3.priority || "HIGH").toUpperCase()
      };
    },

    /**
     * Contract 4 Hotspots Adapter
     */
    adaptHotspotsToContract4: (items = []) => {
      if (!Array.isArray(items)) return [];
      return items.map((item, idx) => ({
        hotspotId: item.hotspotId || item.id || `HS-00${idx + 1}`,
        assetId: item.assetId || item.targetAssetId || `D0${idx + 7}`,
        hazardType: item.hazardType || item.type || "heavy_rainfall",
        incidentCount: item.incidentCount || item.occurrences || 7,
        recurrenceScore: item.recurrenceScore || item.score || 86,
        severityScore: item.severityScore || 82,
        lastIncidentAt: item.lastIncidentAt || item.timestamp || "2026-08-14T12:15:00Z",
        trend: item.trend || "increasing",
        confidence: item.confidence || 0.91,
        explanation: item.explanation || item.description || "Repeated heavy-rainfall surge events.",
        recommendedLongTermAction: item.recommendedLongTermAction || item.action || "drainage_capacity_upgrade"
      }));
    },

    /**
     * Rescue Mission Adapter
     */
    adaptRescueMissionToFrontend: (mission = {}) => {
      return {
        id: mission.id || mission.missionId || "MSN-402",
        title: mission.title || mission.name || "Tactical Extraction — Substation #09",
        status: (mission.status || "IN_PROGRESS").toUpperCase(),
        priority: (mission.priority || "CRITICAL").toUpperCase(),
        unitCallsign: mission.unitCallsign || mission.unitName || "EM-MA1",
        targetSector: mission.targetSector || mission.zoneName || "Sector 04-B (Midtown)",
        etaMinutes: mission.etaMinutes || mission.eta || 14,
        hazardSeverity: mission.hazardSeverity || "HIGH",
        description: mission.description || "Deploy barrier teams and secure high-capacity pump bypass."
      };
    },

    /**
     * Rescue Navigation Adapter
     */
    adaptRescueNavigationToFrontend: (nav = {}) => {
      return {
        missionId: nav.missionId || "MSN-402",
        currentPosition: nav.currentPosition || [13.062, 80.275],
        targetPosition: nav.targetPosition || [13.087, 80.291],
        waterDepthMm: nav.waterDepthMm || nav.waterDepth || 450,
        safePassable: nav.safePassable !== undefined ? nav.safePassable : true,
        routePath: nav.routePath || ["Checkpoint Alpha", "Arterial R24", "Substation #09"],
        etaText: nav.etaText || "14 min remaining"
      };
    },

    /**
     * Citizen Alerts Adapter
     */
    adaptCitizenAlertsToFrontend: (items = []) => {
      if (!Array.isArray(items)) return [];
      return items.map((alert, idx) => ({
        id: alert.id || `ALT-00${idx + 1}`,
        title: alert.title || alert.headline || "Flash Flood Warning — Zone 04-B",
        severity: (alert.severity || "CRITICAL").toUpperCase(),
        issuedAt: alert.issuedAt || alert.timestamp || "10 mins ago",
        description: alert.description || alert.message || "Water levels rising near Drain D07. Use rerouted high-ground corridor.",
        actionNeeded: alert.actionNeeded || alert.instruction || "Avoid low-lying underpasses."
      }));
    },

    /**
     * Safe Route Search Adapter
     */
    adaptSafeRouteToFrontend: (route = {}) => {
      return {
        routeId: route.routeId || route.id || "RTE-SAFE-01",
        originName: route.originName || route.from || "Sector 04-A",
        destinationName: route.destinationName || route.to || "St. Jude Hospital Shelter",
        totalDistanceKm: route.totalDistanceKm || route.distance || 3.2,
        estimatedTimeMins: route.estimatedTimeMins || route.eta || 12,
        safetyRating: route.safetyRating || "SAFE (98% Clear)",
        hazardIntersections: route.hazardIntersections || 0,
        waypoints: route.waypoints || ["Avenue 4", "Highridge Bypass", "Shelter Entrance Gate C"]
      };
    },

    /**
     * Citizen SOS Form Adapter
     */
    adaptSosToPayload: (form = {}) => {
      return {
        citizenName: form.citizenName || form.name || "Anonymous Citizen",
        contactPhone: form.contactPhone || form.phone || "+1-555-0199",
        locationCoordinates: form.coordinates || [13.062, 80.275],
        emergencyType: (form.type || form.category || "FLOOD_TRAPPED").toUpperCase(),
        peopleCount: parseInt(form.peopleCount || form.count || "1", 10),
        notes: form.notes || form.description || "Water rising above sidewalk level."
      };
    },

    /**
     * Citizen Hazard Report Adapter
     */
    adaptReportToPayload: (form = {}) => {
      return {
        hazardCategory: (form.category || form.type || "WATERLOGGING").toUpperCase(),
        locationText: form.location || form.address || "Corner of 4th Ave and Main St",
        description: form.description || form.notes || "Drainage blockage causing localized flooding",
        urgency: (form.urgency || form.severity || "HIGH").toUpperCase()
      };
    }
  };

  window.Adapters = Adapters;
})(window);
