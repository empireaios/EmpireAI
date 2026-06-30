import type { RegisteredTool } from "../../../brain/types.js";
import { buildCustomerPsychologyEngine } from "../services/customer-psychology-engine-service.js";

export const customerPsychologyEngineTools: RegisteredTool[] = [{
  name: "customer_psychology_engine.dashboard",
  description: "REAL-028 Customer psychology engine dashboard",
  module: "customer-psychology-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCustomerPsychologyEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
