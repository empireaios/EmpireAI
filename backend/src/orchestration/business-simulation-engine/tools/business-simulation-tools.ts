import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildBusinessSimulationSummary,
  compareBusinessSimulations,
  getBusinessSimulation,
  getBusinessSimulationForecast,
  getBusinessSimulationRecommendation,
  runBusinessSimulationForBuild,
} from "../services/business-simulation-service.js";

export const businessSimulationEngineTools: RegisteredTool[] = [
  {
    name: "business_simulation.run",
    description: "Simulate business performance from build package — no publication or ad execution",
    module: "business-simulation-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        buildId: { type: "string" },
        actor: { type: "string" },
        configuredCapitalConstraint: { type: "number" },
      },
      required: ["buildId"],
    },
    handler: async (args) =>
      runBusinessSimulationForBuild(
        String(args.buildId),
        args.actor ? String(args.actor) : undefined,
        typeof args.configuredCapitalConstraint === "number"
          ? { configuredCapitalConstraint: args.configuredCapitalConstraint }
          : undefined,
      ),
  },
  {
    name: "business_simulation.summary",
    description: "Workspace summary of business simulations and launch recommendations",
    module: "business-simulation-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildBusinessSimulationSummary(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "business_simulation.compare",
    description: "Compare two business simulations side-by-side",
    module: "business-simulation-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        simulationA: { type: "string" },
        simulationB: { type: "string" },
      },
      required: ["simulationA", "simulationB"],
    },
    handler: async (args) =>
      compareBusinessSimulations(String(args.simulationA), String(args.simulationB)),
  },
  {
    name: "business_simulation.forecast",
    description: "Get financial forecast from a business simulation",
    module: "business-simulation-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { simulationId: { type: "string" } },
      required: ["simulationId"],
    },
    handler: async (args) => getBusinessSimulationForecast(String(args.simulationId)),
  },
  {
    name: "business_simulation.recommendation",
    description: "Get launch recommendation from a business simulation",
    module: "business-simulation-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { simulationId: { type: "string" } },
      required: ["simulationId"],
    },
    handler: async (args) => getBusinessSimulationRecommendation(String(args.simulationId)),
  },
];

export { buildBusinessSimulationDashboard } from "../services/business-simulation-service.js";
