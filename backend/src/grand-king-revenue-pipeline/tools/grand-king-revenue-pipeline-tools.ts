import type { RegisteredTool } from "../../brain/types.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../grand-king/constants.js";
import { buildRevenuePipelineDashboard } from "../services/revenue-pipeline-dashboard-service.js";
import { buildRevenuePipelineHeadquarters } from "../services/revenue-headquarters-service.js";
import { getRevenuePipelineRuntime, listPipelineProducts } from "../services/revenue-pipeline-runtime.js";

export const grandKingRevenuePipelineTools: RegisteredTool[] = [
  {
    name: "grand_king_revenue_pipeline.dashboard",
    description: "Grand King Revenue Pipeline dashboard (GKR-003)",
    module: "grand-king-revenue-pipeline",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildRevenuePipelineDashboard(
        args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID,
        String(args.companyId ?? GRAND_KING_COMPANY_ID),
      ),
  },
  {
    name: "grand_king_revenue_pipeline.headquarters",
    description: "Revenue Pipeline Executive Headquarters (GKR-010)",
    module: "grand-king-revenue-pipeline",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildRevenuePipelineHeadquarters(
        args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID,
        String(args.companyId ?? GRAND_KING_COMPANY_ID),
      ),
  },
  {
    name: "grand_king_revenue_pipeline.runtime",
    description: "Revenue Pipeline runtime status (GKR-001)",
    module: "grand-king-revenue-pipeline",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      getRevenuePipelineRuntime(
        args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID,
        String(args.companyId ?? GRAND_KING_COMPANY_ID),
      ),
  },
  {
    name: "grand_king_revenue_pipeline.products",
    description: "List pipeline products",
    module: "grand-king-revenue-pipeline",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      listPipelineProducts(
        args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID,
        String(args.companyId ?? GRAND_KING_COMPANY_ID),
      ),
  },
];
