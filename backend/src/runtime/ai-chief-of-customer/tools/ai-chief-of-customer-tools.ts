import type { RegisteredTool } from "../../../brain/types.js";
import { buildAiChiefOfCustomer } from "../services/ai-chief-of-customer-service.js";

export const aiChiefOfCustomerTools: RegisteredTool[] = [{
  name: "ai_chief_of_customer.dashboard",
  description: "REAL-033 AI Chief of Customer dashboard",
  module: "ai-chief-of-customer",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildAiChiefOfCustomer(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
