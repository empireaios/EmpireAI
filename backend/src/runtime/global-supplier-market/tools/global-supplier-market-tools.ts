import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalSupplierMarket } from "../services/global-supplier-market-service.js";

export const globalSupplierMarketTools: RegisteredTool[] = [{
  name: "global_supplier_market.dashboard",
  description: "REAL-071 global-supplier-market dashboard",
  module: "global-supplier-market",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalSupplierMarket(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
