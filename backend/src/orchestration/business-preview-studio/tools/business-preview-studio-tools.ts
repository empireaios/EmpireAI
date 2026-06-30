import type { RegisteredTool } from "../../../brain/types.js";
import {
  approveBusinessPreviewForBuild,
  generateBusinessPreviewForOpportunity,
  getBusinessPreview,
  listBusinessPreviews,
  regenerateBusinessPreview,
} from "../services/business-preview-studio-service.js";

export const businessPreviewStudioTools: RegisteredTool[] = [
  {
    name: "business_preview.generate",
    description: "Generate complete visual business preview from approved opportunity — preview only, no publishing",
    module: "business-preview-studio",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        businessOpportunityId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["businessOpportunityId"],
    },
    handler: async (args) =>
      generateBusinessPreviewForOpportunity(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "business_preview.list",
    description: "List business previews for Grand King account",
    module: "business-preview-studio",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      listBusinessPreviews(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "business_preview.get",
    description: "Get a business preview by ID with all brand, product, and marketplace preview assets",
    module: "business-preview-studio",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { previewId: { type: "string" } },
      required: ["previewId"],
    },
    handler: async (args) => getBusinessPreview(String(args.previewId)),
  },
  {
    name: "business_preview.regenerate",
    description: "Regenerate business preview assets — preview only, no marketplace modifications",
    module: "business-preview-studio",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        previewId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["previewId"],
    },
    handler: async (args) =>
      regenerateBusinessPreview(
        String(args.previewId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "business_preview.approve",
    description: "Grand King approves business preview for build — no execution or publishing triggered",
    module: "business-preview-studio",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        previewId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["previewId"],
    },
    handler: async (args) =>
      approveBusinessPreviewForBuild(
        String(args.previewId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
];

export { buildBusinessPreviewDashboard } from "../services/business-preview-studio-service.js";
