import type { RegisteredTool } from "../../../brain/types.js";
import { buildFirstOrderOperations } from "../services/first-order-operations-service.js";

export const firstOrderOperationsTools: RegisteredTool[] = [{
  name: "first_order_operations.dashboard",
  description: "REAL-039 First order operations milestone dashboard",
  module: "first-order-operations",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildFirstOrderOperations(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
