import type { RegisteredTool } from "../../../brain/types.js";
import { buildProductionHardening } from "../services/production-hardening-service.js";

export const productionHardeningTools: RegisteredTool[] = [{
  name: "production_hardening.dashboard",
  description: "REAL-047 Production hardening dashboard",
  module: "production-hardening",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildProductionHardening(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
