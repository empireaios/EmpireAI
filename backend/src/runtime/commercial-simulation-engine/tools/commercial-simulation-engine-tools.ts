import type { RegisteredTool } from "../../../brain/types.js";
import { buildCommercialSimulationEngine } from "../services/commercial-simulation-engine-service.js";

export const commercialSimulationEngineTools: RegisteredTool[] = [{
  name: "commercial_simulation_engine.dashboard",
  description: "REAL-064 Commercial simulation engine dashboard",
  module: "commercial-simulation-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCommercialSimulationEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
