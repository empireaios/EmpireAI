import type { RegisteredTool, ToolContext } from "../../../brain/types.js";
import { getCustomerOrderPipelineRepository } from "../../../revenue/customer-order-pipeline/repositories/sqlite-customer-order-pipeline-repository.js";
import { loadLiveCjFulfillmentEnv } from "../config/live-cj-fulfillment-env.js";
import {
  executeLiveCjSubmit,
  getLiveCjFulfillmentById,
  listFulfillmentAttempts,
  listLiveCjFulfillments,
  LiveCjFulfillmentBlockedError,
  prepareLiveCjFulfillment,
  syncLiveCjTracking,
} from "../services/live-cj-fulfillment-service.js";

function assertWorkspace(resource: { workspaceId: string } | null, context: ToolContext): void {
  if (!resource || !context.workspaceId || resource.workspaceId !== context.workspaceId) {
    throw new LiveCjFulfillmentBlockedError("Resource unavailable in this tool workspace");
  }
}

function fulfillmentInWorkspace(fulfillmentId: string, context: ToolContext) {
  const fulfillment = getLiveCjFulfillmentById(fulfillmentId);
  assertWorkspace(fulfillment, context);
  return fulfillment!;
}

function rejectModelApproval(): never {
  throw new LiveCjFulfillmentBlockedError("Model-generated tokens cannot grant founder authority. Use the authenticated owner approval route; commerce remains locked.");
}

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
    handler: async (args, context) => {
      const pipelineId = String(args.pipelineId);
      assertWorkspace(getCustomerOrderPipelineRepository().getPipelineById(pipelineId), context);
      return prepareLiveCjFulfillment({ pipelineId });
    },
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
    handler: async () => rejectModelApproval(),
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
    handler: async (args, context) => {
      fulfillmentInWorkspace(String(args.fulfillmentId), context);
      // No authenticated actor/authority receipt exists in ToolContext. Only
      // explicit local synthetic fixtures may exercise this tool path.
      const env = loadLiveCjFulfillmentEnv();
      if (process.env.NODE_ENV !== "test" || !env.LIVE_CJ_FULFILLMENT_MOCK) {
        throw new LiveCjFulfillmentBlockedError("Model tool cannot authorize live supplier execution; trusted owner authority is required.");
      }
      // Rejections must propagate: the dispatcher labels a resolved tool result
      // completed, including a resolved {blocked:true} object.
      return executeLiveCjSubmit(String(args.fulfillmentId));
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
    handler: async (args, context) => {
      fulfillmentInWorkspace(String(args.fulfillmentId), context);
      return syncLiveCjTracking(String(args.fulfillmentId), {
        markDelivered: args.markDelivered === true,
      });
    },
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
    handler: async () => rejectModelApproval(),
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
    handler: async (args, context) => {
      assertWorkspace({workspaceId: String(args.workspaceId)}, context);
      return { fulfillments: listLiveCjFulfillments(context.workspaceId,
        args.companyId ? String(args.companyId) : undefined) };
    },
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
    handler: async (args, context) => {
      const fulfillmentId = String(args.fulfillmentId);
      const fulfillment = fulfillmentInWorkspace(fulfillmentId, context);
      return {
        fulfillment,
        attempts: listFulfillmentAttempts(fulfillmentId),
      };
    },
  },
];
