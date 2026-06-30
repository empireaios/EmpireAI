import type { RegisteredTool } from "../../../brain/types.js";
import {
  getCommerceLaunchDecision,
  getCommerceReadinessBlockers,
  getCommerceReadinessEvaluation,
  getCommerceReadinessSummary,
} from "../services/commerce-readiness-service.js";

export const commerceReadinessTools: RegisteredTool[] = [
  {
    name: "commerce_readiness.evaluate",
    description: "Full commerce readiness evaluation across accounts, marketplaces, suppliers, products, brands, payment, fulfillment, governance, and treasury — evaluation only",
    module: "commerce-readiness-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        accountType: { type: "string", enum: ["grand_king", "founder"] },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      getCommerceReadinessEvaluation({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        accountType: (args.accountType as "grand_king" | "founder") ?? "grand_king",
      }),
  },
  {
    name: "commerce_readiness.summary",
    description: "Commerce readiness summary with overall score and launch decision",
    module: "commerce-readiness-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        accountType: { type: "string", enum: ["grand_king", "founder"] },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      getCommerceReadinessSummary({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        accountType: (args.accountType as "grand_king" | "founder") ?? "grand_king",
      }),
  },
  {
    name: "commerce_readiness.blockers",
    description: "Structured readiness blockers with INFO, WARNING, and BLOCKING severity",
    module: "commerce-readiness-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        accountType: { type: "string", enum: ["grand_king", "founder"] },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      getCommerceReadinessBlockers({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        accountType: (args.accountType as "grand_king" | "founder") ?? "grand_king",
      }),
  },
  {
    name: "commerce_readiness.launch_decision",
    description: "Launch decision: NOT_READY, READY_WITH_WARNINGS, or READY_TO_LAUNCH",
    module: "commerce-readiness-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        accountType: { type: "string", enum: ["grand_king", "founder"] },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      getCommerceLaunchDecision({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        accountType: (args.accountType as "grand_king" | "founder") ?? "grand_king",
      }),
  },
];
