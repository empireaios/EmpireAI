/**
 * G6-09 — Production simulation Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitProductionSimulationView } from "../contracts/production-simulation-cockpit-contracts.js";
import {
  getLastProductionSimulationRun,
  getProductionSimulationOverview,
  runFullProductionSimulation,
  runSimulationScenario,
} from "../services/production-simulation-certification-service.js";

export const productionSimulationTools: RegisteredTool[] = [
  {
    name: "production_simulation_overview",
    description: "G6-09 — Production simulation certification overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getProductionSimulationOverview({ workspaceId });
      const run = getLastProductionSimulationRun();
      return { overview, cockpitView: buildCockpitProductionSimulationView({ overview, run }) };
    },
  },
  {
    name: "run_simulation_scenario",
    description: "G6-09 — Run a single registry-defined simulation scenario",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        scenarioId: { type: "string" },
        simulationType: { type: "string" },
      },
      required: ["workspaceId", "actorId", "scenarioId"],
    },
    handler: async (args) =>
      runSimulationScenario({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        scenarioId: String(args.scenarioId),
        simulationType: args.simulationType ? String(args.simulationType) as "dry_run" : undefined,
        pillowGovernance: true,
      }),
  },
  {
    name: "run_full_production_simulation",
    description: "G6-09 — Run full end-to-end production simulation",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        simulationType: { type: "string" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runFullProductionSimulation({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        simulationType: args.simulationType ? String(args.simulationType) as "dry_run" : undefined,
        pillowGovernance: true,
      }),
  },
  {
    name: "simulation_status",
    description: "G6-09 — Latest production simulation status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getProductionSimulationOverview({ workspaceId });
      const run = getLastProductionSimulationRun();
      return {
        overview,
        lastRun: run
          ? { runId: run.runId, status: run.status, simulationScore: run.simulationScore, scannedAt: run.scannedAt }
          : undefined,
        cockpitView: buildCockpitProductionSimulationView({ overview, run }),
      };
    },
  },
  {
    name: "simulation_evidence",
    description: "G6-09 — Production simulation evidence",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const run = runFullProductionSimulation({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { evidence: run.evidence, simulations: run.simulations.map((s) => ({ scenarioId: s.scenarioId, status: s.status })) };
    },
  },
  {
    name: "simulation_blockers",
    description: "G6-09 — Production simulation blockers",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const run = runFullProductionSimulation({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { blockers: run.blockers, warnings: run.warnings, status: run.status };
    },
  },
  {
    name: "simulation_recommendations",
    description: "G6-09 — Production simulation recommendations",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const run = runFullProductionSimulation({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { executiveRecommendations: run.executiveRecommendations, safeExecutionVerified: run.safeExecutionVerified };
    },
  },
];
