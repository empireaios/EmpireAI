import type { RegisteredTool } from "../../../brain/types.js";
import {
  applyFounderApproval,
  executeLiveCjSubmit,
  getLiveCjFulfillmentById,
  listFulfillmentAttempts,
  listLiveCjFulfillments,
  LiveCjFulfillmentBlockedError,
  prepareLiveCjFulfillment,
  recoverFailedFulfillment,
  syncLiveCjTracking,
} from "../services/live-cj-fulfillment-service.js";

export const liveCjFulfillmentTools: RegisteredTool[] = [
  {
    name: "live_cj_fulfillment.prepare",
    description: "Prepare LIVE CJ fulfillment job — PENDING_FOUNDER_APPROVAL, never auto-submits",
    module: "live-cj-fulfillment",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { pipelineId: { type: "string" } },
      required: ["pipelineId"],
    },
    handler: async (args) => prepareLiveCjFulfillment({ pipelineId: String(args.pipelineId) }),
  },
  {
    name: "live_cj_fulfillment.apply_founder_approval",
    description: "Apply Grand King founder approval before LIVE CJ submit",
    module: "live-cj-fulfillment",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        fulfillmentId: { type: "string" },
        approvalToken: { type: "string" },
        approvedBy: { type: "string" },
        approvedAt: { type: "string" },
      },
      required: ["fulfillmentId", "approvalToken", "approvedBy", "approvedAt"],
    },
    handler: async (args) =>
      applyFounderApproval({
        fulfillmentId: String(args.fulfillmentId),
        approvalToken: String(args.approvalToken),
        approvedBy: String(args.approvedBy),
        approvedAt: String(args.approvedAt),
      }),
  },
  {
    name: "live_cj_fulfillment.submit_live",
    description: "Execute LIVE CJ submit — requires LIVE_CJ_FULFILLMENT_ENABLED and founder approval",
    module: "live-cj-fulfillment",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { fulfillmentId: { type: "string" } },
      required: ["fulfillmentId"],
    },
    handler: async (args) => {
      try {
        return await executeLiveCjSubmit(String(args.fulfillmentId));
      } catch (error) {
        if (error instanceof LiveCjFulfillmentBlockedError) {
          return { blocked: true, error: error.message, protectTheEmpire: true };
        }
        throw error;
      }
    },
  },
  {
    name: "live_cj_fulfillment.sync_tracking",
    description: "Sync LIVE CJ tracking and update order pipeline status",
    module: "live-cj-fulfillment",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        fulfillmentId: { type: "string" },
        markDelivered: { type: "boolean" },
      },
      required: ["fulfillmentId"],
    },
    handler: async (args) =>
      syncLiveCjTracking(String(args.fulfillmentId), {
        markDelivered: args.markDelivered === true,
      }),
  },
  {
    name: "live_cj_fulfillment.recover_failed",
    description: "Founder-approved failure recovery — re-enables LIVE submit retry",
    module: "live-cj-fulfillment",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        fulfillmentId: { type: "string" },
        approvalToken: { type: "string" },
        approvedBy: { type: "string" },
        approvedAt: { type: "string" },
      },
      required: ["fulfillmentId", "approvalToken", "approvedBy", "approvedAt"],
    },
    handler: async (args) =>
      recoverFailedFulfillment({
        fulfillmentId: String(args.fulfillmentId),
        approvalToken: String(args.approvalToken),
        approvedBy: String(args.approvedBy),
        approvedAt: String(args.approvedAt),
      }),
  },
  {
    name: "live_cj_fulfillment.list",
    description: "List LIVE CJ fulfillment jobs for a workspace",
    module: "live-cj-fulfillment",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => ({
      fulfillments: listLiveCjFulfillments(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
    }),
  },
  {
    name: "live_cj_fulfillment.get",
    description: "Get LIVE CJ fulfillment job with attempt history",
    module: "live-cj-fulfillment",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { fulfillmentId: { type: "string" } },
      required: ["fulfillmentId"],
    },
    handler: async (args) => {
      const fulfillmentId = String(args.fulfillmentId);
      return {
        fulfillment: getLiveCjFulfillmentById(fulfillmentId),
        attempts: listFulfillmentAttempts(fulfillmentId),
      };
    },
  },
];
