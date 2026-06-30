import type { RegisteredTool } from "../../brain/types.js";
import {
  DEFAULT_M072_IDS,
  runAutonomousCompanyManufacturingLoop,
} from "../../execution/autonomous-company-manufacturing-loop/index.js";
import {
  applyOrderApproval,
  prepareManufacturingFulfillment,
} from "../../fulfillment/manufacturing-fulfillment-bridge.js";
import { buildOrderPayload } from "../../suppliers/cj-dropshipping/orders/cj-order-mapper.js";
import {
  createOrderExecutionSessionId,
  orderExecutionSessionStore,
} from "./session-store.js";
import {
  OrderSandboxSubmissionBlockedError,
  submitApprovedOrderSandboxOnly,
} from "./sandbox-submit.js";
import type { OrderExecutionSession } from "./types.js";
import {
  toDraftOrderView,
  toFulfillmentPreparationView,
  toFulfillmentReadinessView,
  toSandboxSubmissionView,
} from "./ui-shapes.js";

function resolveSession(
  workspaceId: string,
  companyId?: string,
): OrderExecutionSession {
  const session = orderExecutionSessionStore.get(workspaceId, companyId);
  if (!session?.preparation) {
    throw new Error(
      "No fulfillment session found. Run order.prepare_fulfillment_from_manufacturing_run first.",
    );
  }
  return session;
}

const sessionParams = {
  type: "object",
  properties: {
    workspaceId: { type: "string" },
    companyId: { type: "string" },
  },
  required: ["workspaceId"],
} as const;

export const orderExecutionTools: RegisteredTool[] = [
  {
    name: "order.prepare_fulfillment_from_manufacturing_run",
    description:
      "Prepare CJ fulfillment from an M072 manufacturing run — readiness, estimates, and draft order (no submission)",
    module: "orders",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        useDeterministicMocks: { type: "boolean" },
      },
      required: ["workspaceId"],
    },
    handler: async (args, context) => {
      const workspaceId = String(args.workspaceId ?? context.workspaceId);
      const companyId =
        args.companyId !== undefined ? String(args.companyId) : context.companyId;

      const run = await runAutonomousCompanyManufacturingLoop({
        workspaceId,
        deterministicIds:
          args.useDeterministicMocks === true ? DEFAULT_M072_IDS : undefined,
      });

      const preparation = await prepareManufacturingFulfillment({
        run,
        workspaceId,
        runId: companyId ? `mfg-${companyId}` : undefined,
      });

      const draftPayload = buildOrderPayload(preparation.draftOrder);
      const now = new Date().toISOString();

      const session: OrderExecutionSession = {
        sessionId: createOrderExecutionSessionId(),
        workspaceId,
        companyId,
        runId: preparation.runId,
        preparation,
        draftOrder: preparation.draftOrder,
        draftPayload,
        approvedOrder: null,
        lastSubmission: null,
        tracking: null,
        updatedAt: now,
      };

      orderExecutionSessionStore.save(session);
      return toFulfillmentPreparationView(session, preparation, draftPayload);
    },
  },
  {
    name: "order.get_fulfillment_readiness",
    description: "Get fulfillment readiness, safety gate, and supplier validation for the current session",
    module: "orders",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );
      const preparation = session.preparation!;

      return {
        sessionId: session.sessionId,
        runId: preparation.runId,
        readiness: toFulfillmentReadinessView(preparation),
        estimatedCost: preparation.estimatedCost,
        estimatedDeliveryDaysMin: preparation.estimatedDeliveryDaysMin,
        estimatedDeliveryDaysMax: preparation.estimatedDeliveryDaysMax,
        currency: preparation.currency,
        supplierValidation: preparation.supplierValidation,
        approvalGate: {
          satisfied: Boolean(
            session.approvedOrder?.approval?.approved === true &&
              session.approvedOrder.status === "APPROVED",
          ),
          orderStatus: session.approvedOrder?.status ?? session.draftOrder?.status ?? "UNKNOWN",
        },
        autoSubmitEnabled: false,
        liveSubmitEnabled: false,
      };
    },
  },
  {
    name: "order.get_draft_order",
    description: "Get the draft order record and CJ payload for the current fulfillment session",
    module: "orders",
    authorityLevel: "L0",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );

      const order = session.approvedOrder ?? session.draftOrder ?? session.preparation!.draftOrder;
      const payload = session.draftPayload ?? buildOrderPayload(order);

      return {
        sessionId: session.sessionId,
        draftOrder: toDraftOrderView(order, payload),
        approvalGate: {
          satisfied: Boolean(
            session.approvedOrder?.approval?.approved === true &&
              session.approvedOrder.status === "APPROVED",
          ),
          orderStatus: order.status,
        },
      };
    },
  },
  {
    name: "order.apply_order_approval",
    description:
      "Apply founder approval gate to the draft order — requires approvalToken, approvedBy, approvedAt, approved=true",
    module: "orders",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        approvalToken: { type: "string" },
        approvedBy: { type: "string" },
        approvedAt: { type: "string" },
      },
      required: ["workspaceId", "approvalToken", "approvedBy", "approvedAt"],
    },
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );

      const approvalToken = String(args.approvalToken ?? "").trim();
      const approvedBy = String(args.approvedBy ?? "").trim();
      const approvedAt = String(args.approvedAt ?? "").trim();

      if (!approvalToken || !approvedBy || !approvedAt) {
        throw new Error(
          "Approval gate requires approvalToken, approvedBy, approvedAt, and approved=true.",
        );
      }

      const approvedOrder = applyOrderApproval(session.preparation!.draftOrder, {
        approvalToken,
        approvedBy,
        approvedAt,
        approved: true,
      });

      const updated: OrderExecutionSession = {
        ...session,
        approvedOrder,
        draftOrder: approvedOrder,
        draftPayload: buildOrderPayload(approvedOrder),
        updatedAt: new Date().toISOString(),
      };

      orderExecutionSessionStore.save(updated);

      return {
        sessionId: updated.sessionId,
        orderId: approvedOrder.orderId,
        status: approvedOrder.status,
        approvalGate: {
          satisfied: true,
          approvalToken,
          approvedBy,
          approvedAt,
          approved: true,
          orderStatus: approvedOrder.status,
        },
        sandboxSubmitAllowed: approvedOrder.integrationMode === "SANDBOX",
        liveSubmitEnabled: false,
        message: "Approval applied. Sandbox submit available — live submission remains disabled.",
      };
    },
  },
  {
    name: "order.submit_approved_order_sandbox_only",
    description:
      "Submit an approved order in SANDBOX mode only — rejects LIVE, no payment, no wallet deduction",
    module: "orders",
    authorityLevel: "L2",
    parameters: sessionParams,
    handler: async (args, context) => {
      const session = resolveSession(
        String(args.workspaceId ?? context.workspaceId),
        args.companyId !== undefined ? String(args.companyId) : context.companyId,
      );

      const order = session.approvedOrder;
      if (!order) {
        throw new Error(
          "No approved order in session. Apply order approval before sandbox submit.",
        );
      }

      try {
        const { submission, tracking } = await submitApprovedOrderSandboxOnly(order);

        const updated: OrderExecutionSession = {
          ...session,
          lastSubmission: submission,
          tracking,
          draftOrder: {
            ...order,
            status: "SUBMITTED",
            fulfillmentStatus: "SUBMITTED",
            supplierOrderId: submission.supplierOrderId,
            trackingNumber: tracking.trackingNumber,
            carrier: tracking.carrier,
            trackingEvents: tracking.events,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        };

        orderExecutionSessionStore.save(updated);
        return toSandboxSubmissionView(submission, tracking);
      } catch (error) {
        if (error instanceof OrderSandboxSubmissionBlockedError) {
          throw error;
        }
        throw error;
      }
    },
  },
];
