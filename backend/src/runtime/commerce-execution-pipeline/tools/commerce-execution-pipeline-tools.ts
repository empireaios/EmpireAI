import type { RegisteredTool } from "../../../brain/types.js";
import { SupplierProductInputSchema } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildCommerceExecutionPipeline } from "../services/commerce-execution-pipeline-service.js";
import { buildGlobalCommerceExecutionDashboard } from "../services/global-commerce-execution-dashboard-service.js";

export const commerceExecutionPipelineTools: RegisteredTool[] = [
  {
    name: "commerce_execution_pipeline.dashboard",
    description: "REAL-006 global commerce execution dashboard",
    module: "commerce-execution-pipeline",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildGlobalCommerceExecutionDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
  {
    name: "commerce_execution_pipeline.build",
    description: "REAL-006 build commerce execution pipeline",
    module: "commerce-execution-pipeline",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        productId: { type: "string" },
        product: { type: "object" },
      },
      required: ["productId", "product"],
    },
    handler: async (args) => {
      const product = SupplierProductInputSchema.parse(args.product);
      return buildCommerceExecutionPipeline(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
        product,
        String(args.productId),
      );
    },
  },
];
