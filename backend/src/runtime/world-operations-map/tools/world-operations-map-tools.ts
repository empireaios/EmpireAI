import type { RegisteredTool } from "../../../brain/types.js";
import { buildWorldOperationsMap } from "../services/world-operations-map-service.js";

export const worldOperationsMapTools: RegisteredTool[] = [{
  name: "world_operations_map.dashboard",
  description: "REAL-052 World operations map hierarchy dashboard",
  module: "world-operations-map",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildWorldOperationsMap(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
