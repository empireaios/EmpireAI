import type { RegisteredTool } from "../../../brain/types.js";
import { buildCustomerIntelligence } from "../services/customer-intelligence-service.js";

export const customerIntelligenceTools: RegisteredTool[] = [{
  name: "customer_intelligence.dashboard",
  description: "REAL-026 Global customer intelligence dashboard",
  module: "customer-intelligence",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCustomerIntelligence(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
