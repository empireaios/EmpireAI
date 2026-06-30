import type { RegisteredTool } from "../../../brain/types.js";
import { buildCommercialMemoryEngine } from "../services/commercial-memory-engine-service.js";

export const commercialMemoryEngineTools: RegisteredTool[] = [{
  name: "commercial_memory_engine.dashboard",
  description: "REAL-060 Commercial memory engine dashboard",
  module: "commercial-memory-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCommercialMemoryEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
