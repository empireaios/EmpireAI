import type { RegisteredTool } from "../../../brain/types.js";
import { buildProductScaleEngine } from "../services/product-scale-engine-service.js";

export const productScaleEngineTools: RegisteredTool[] = [{
  name: "product_scale_engine.dashboard",
  description: "REAL-079 product-scale-engine dashboard",
  module: "product-scale-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildProductScaleEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
