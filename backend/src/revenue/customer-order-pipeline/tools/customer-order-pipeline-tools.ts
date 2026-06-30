import type { RegisteredTool } from "../../../brain/types.js";
import {
  applyPipelineApproval,
  completePipelineDelivery,
  CustomerOrderPipelineBlockedError,
  getPipelineById,
  getPipelineStageIndex,
  ingestVerifiedPayment,
  listPipelines,
  runSandboxFulfillmentCycle,
  startCheckoutPipeline,
  submitPipelineFulfillment,
  syncPipelineTracking,
} from "../services/customer-order-pipeline-service.js";

export const customerOrderPipelineTools: RegisteredTool[] = [
  {
    name: "customer_order.start_checkout",
    description: "Start customer order pipeline at checkout",
    module: "customer-orders",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        storeId: { type: "string" },
        brandId: { type: "string" },
        customerEmail: { type: "string" },
        customerName: { type: "string" },
        revenueCents: { type: "number" },
        currency: { type: "string" },
        correlationId: { type: "string" },
      },
      required: [
        "workspaceId",
        "companyId",
        "storeId",
        "brandId",
        "customerEmail",
        "customerName",
        "revenueCents",
        "correlationId",
      ],
    },
    handler: async (args) =>
      startCheckoutPipeline({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        storeId: String(args.storeId),
        brandId: String(args.brandId),
        customerEmail: String(args.customerEmail),
        customerName: String(args.customerName),
        revenueCents: Number(args.revenueCents),
        currency: args.currency ? String(args.currency) : undefined,
        correlationId: String(args.correlationId),
      }),
  },
  {
    name: "customer_order.ingest_payment",
    description: "Ingest verified M103 payment into order pipeline — order created + inventory reserved",
    module: "customer-orders",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { paymentId: { type: "string" } },
      required: ["paymentId"],
    },
    handler: async (args) => ingestVerifiedPayment(String(args.paymentId)),
  },
  {
    name: "customer_order.apply_approval",
    description: "Apply founder approval before CJ fulfillment submission",
    module: "customer-orders",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pipelineId: { type: "string" },
        approvalToken: { type: "string" },
        approvedBy: { type: "string" },
        approvedAt: { type: "string" },
      },
      required: ["pipelineId", "approvalToken", "approvedBy", "approvedAt"],
    },
    handler: async (args) =>
      applyPipelineApproval({
        pipelineId: String(args.pipelineId),
        approvalToken: String(args.approvalToken),
        approvedBy: String(args.approvedBy),
        approvedAt: String(args.approvedAt),
      }),
  },
  {
    name: "customer_order.submit_fulfillment",
    description: "Submit approved order to CJ — sandbox by default, live gated",
    module: "customer-orders",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { pipelineId: { type: "string" } },
      required: ["pipelineId"],
    },
    handler: async (args) => {
      try {
        return await submitPipelineFulfillment(String(args.pipelineId));
      } catch (error) {
        if (error instanceof CustomerOrderPipelineBlockedError) {
          return { blocked: true, error: error.message, protectTheEmpire: true };
        }
        throw error;
      }
    },
  },
  {
    name: "customer_order.sync_tracking",
    description: "Sync CJ tracking and advance pipeline to IN_TRANSIT or DELIVERED",
    module: "customer-orders",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { pipelineId: { type: "string" } },
      required: ["pipelineId"],
    },
    handler: async (args) => syncPipelineTracking(String(args.pipelineId)),
  },
  {
    name: "customer_order.complete_delivery",
    description: "Mark order delivered and update financial ledger",
    module: "customer-orders",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { pipelineId: { type: "string" } },
      required: ["pipelineId"],
    },
    handler: async (args) => completePipelineDelivery(String(args.pipelineId)),
  },
  {
    name: "customer_order.run_sandbox_cycle",
    description: "Run full sandbox cycle: approve → submit → track → deliver",
    module: "customer-orders",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pipelineId: { type: "string" },
        approvalToken: { type: "string" },
        approvedBy: { type: "string" },
      },
      required: ["pipelineId", "approvalToken", "approvedBy"],
    },
    handler: async (args) =>
      runSandboxFulfillmentCycle({
        pipelineId: String(args.pipelineId),
        approvalToken: String(args.approvalToken),
        approvedBy: String(args.approvedBy),
      }),
  },
  {
    name: "customer_order.list_pipelines",
    description: "List customer order pipelines for a workspace",
    module: "customer-orders",
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
      pipelines: listPipelines(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
    }),
  },
  {
    name: "customer_order.get_pipeline",
    description: "Get a single customer order pipeline with lifecycle status",
    module: "customer-orders",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { pipelineId: { type: "string" } },
      required: ["pipelineId"],
    },
    handler: async (args) => {
      const pipeline = getPipelineById(String(args.pipelineId));
      return {
        pipeline,
        stageIndex: pipeline ? getPipelineStageIndex(pipeline.status) : -1,
      };
    },
  },
];
