"use strict";
/**
 * ClimateShield Orchestration — public API.
 *
 * Programmatic entry point for the incident-response orchestrator. Consumers
 * (a backend controller, a CLI, or a test) supply verified IncidentFacts and
 * receive a PROPOSED ResponsePlan plus the persisted RunState.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistRunState = exports.createRunState = exports.runIncidentResponse = exports.IncidentResponseOrchestrator = void 0;
var orchestrator_js_1 = require("./orchestrator.js");
Object.defineProperty(exports, "IncidentResponseOrchestrator", { enumerable: true, get: function () { return orchestrator_js_1.IncidentResponseOrchestrator; } });
Object.defineProperty(exports, "runIncidentResponse", { enumerable: true, get: function () { return orchestrator_js_1.runIncidentResponse; } });
var state_js_1 = require("./state.js");
Object.defineProperty(exports, "createRunState", { enumerable: true, get: function () { return state_js_1.createRunState; } });
Object.defineProperty(exports, "persistRunState", { enumerable: true, get: function () { return state_js_1.persistRunState; } });
