import type { RegisteredTool } from "../../../brain/types.js";
import { buildCommercialExplorer } from "../services/commercial-explorer-service.js";

export const commercialExplorerTools: RegisteredTool[] = [{
  name: "commercial_explorer.dashboard",
  description: "REAL-066 Commercial explorer dashboard",
  module: "commercial-explorer",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCommercialExplorer(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
