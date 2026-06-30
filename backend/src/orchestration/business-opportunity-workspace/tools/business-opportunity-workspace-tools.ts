import type { RegisteredTool } from "../../../brain/types.js";
import { BUSINESS_OPPORTUNITY_STATUSES } from "../models/business-opportunity.js";
import {
  approveBusinessOpportunity,
  buildBusinessWorkspaceDashboard,
  compareBusinessOpportunities,
  getApprovalHistory,
  listBusinessOpportunities,
  rejectBusinessOpportunity,
  saveBusinessOpportunityForLater,
} from "../services/business-opportunity-workspace-service.js";

export const businessOpportunityWorkspaceTools: RegisteredTool[] = [
  {
    name: "business_workspace.list",
    description: "List ranked business opportunities for Grand King investment review — workspace only",
    module: "business-opportunity-workspace",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        status: { type: "string", enum: [...BUSINESS_OPPORTUNITY_STATUSES] },
        category: { type: "string" },
        favorite: { type: "boolean" },
        minDominationScore: { type: "number" },
        minExpectedRoi: { type: "number" },
        sortBy: { type: "string", enum: ["rank", "dominationScore", "expectedRoi", "launchConfidence"] },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      listBusinessOpportunities(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
        {
          status: args.status as (typeof BUSINESS_OPPORTUNITY_STATUSES)[number] | undefined,
          category: args.category ? String(args.category) : undefined,
          favorite: typeof args.favorite === "boolean" ? args.favorite : undefined,
          minDominationScore: typeof args.minDominationScore === "number" ? args.minDominationScore : undefined,
          minExpectedRoi: typeof args.minExpectedRoi === "number" ? args.minExpectedRoi : undefined,
          sortBy: args.sortBy as "rank" | "dominationScore" | "expectedRoi" | "launchConfidence" | undefined,
        },
      ),
  },
  {
    name: "business_workspace.compare",
    description: "Compare two business opportunities side-by-side with investment highlights",
    module: "business-opportunity-workspace",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        opportunityA: { type: "string" },
        opportunityB: { type: "string" },
      },
      required: ["opportunityA", "opportunityB"],
    },
    handler: async (args) =>
      compareBusinessOpportunities(String(args.opportunityA), String(args.opportunityB)),
  },
  {
    name: "business_workspace.approve",
    description: "Grand King approves a business opportunity — no product build or publishing",
    module: "business-opportunity-workspace",
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
      approveBusinessOpportunity(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "business_workspace.reject",
    description: "Grand King rejects a business opportunity",
    module: "business-opportunity-workspace",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        businessOpportunityId: { type: "string" },
        actor: { type: "string" },
        reason: { type: "string" },
      },
      required: ["businessOpportunityId"],
    },
    handler: async (args) =>
      rejectBusinessOpportunity(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
        args.reason ? String(args.reason) : undefined,
      ),
  },
  {
    name: "business_workspace.save",
    description: "Save business opportunity for later review with optional notes",
    module: "business-opportunity-workspace",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        businessOpportunityId: { type: "string" },
        actor: { type: "string" },
        notes: { type: "string" },
      },
      required: ["businessOpportunityId"],
    },
    handler: async (args) =>
      saveBusinessOpportunityForLater(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
        args.notes ? String(args.notes) : undefined,
      ),
  },
  {
    name: "business_workspace.history",
    description: "Get Grand King approval history for business opportunities",
    module: "business-opportunity-workspace",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        businessOpportunityId: { type: "string" },
      },
    },
    handler: async (args) =>
      getApprovalHistory(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : undefined,
        args.businessOpportunityId ? String(args.businessOpportunityId) : undefined,
      ),
  },
];

export { buildBusinessWorkspaceDashboard };
