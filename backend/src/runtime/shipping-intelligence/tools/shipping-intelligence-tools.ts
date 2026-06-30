import type { RegisteredTool } from "../../../brain/types.js";
import { buildShippingIntelligence } from "../services/shipping-intelligence-service.js";

export const shippingIntelligenceTools: RegisteredTool[] = [{
  name: "shipping_intelligence.dashboard",
  description: "REAL-076 shipping-intelligence dashboard",
  module: "shipping-intelligence",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildShippingIntelligence(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
