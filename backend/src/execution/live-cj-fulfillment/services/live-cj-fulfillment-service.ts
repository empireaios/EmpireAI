import type { Order } from "../../../orders/index.js";
import { isOrderApproved } from "../../../orders/index.js";
import {
  applyTrackingSync,
  syncTrackingFromSnapshot,
} from "../../../suppliers/cj-dropshipping/orders/cj-tracking-sync.js";
import {
  getCustomerOrderPipelineRepository,
} from "../../../revenue/customer-order-pipeline/repositories/sqlite-customer-order-pipeline-repository.js";
import { completePipelineDelivery } from "../../../revenue/customer-order-pipeline/services/customer-order-pipeline-service.js";
import { fulfillInventoryReservation } from "../../../revenue/customer-order-pipeline/services/inventory-reservation-service.js";
import { loadLiveCjFulfillmentEnv } from "../config/live-cj-fulfillment-env.js";
import type { LiveCjFulfillmentRecord } from "../models/live-cj-fulfillment-record.js";
import {
  createAttemptRecord,
  createFulfillmentRecord,
  getLiveCjFulfillmentRepository,
} from "../repositories/sqlite-live-cj-fulfillment-repository.js";
import {
  fetchLiveCjTracking,
  LiveCjFulfillmentBlockedError,
  submitLiveCjOrder,
} from "./cj-live-api-service.js";
import {
  listFulfillmentAttempts,
  prepareFailureRecovery,
  recordSubmitFailure,
  recordSubmitSuccess,
} from "./failure-recovery-service.js";

export { LiveCjFulfillmentBlockedError } from "./cj-live-api-service.js";
export { LiveCjRecoveryBlockedError } from "./failure-recovery-service.js";

export type PrepareLiveCjFulfillmentInput = {
  pipelineId: string;
};

export type ApplyFounderApprovalInput = {
  fulfillmentId: string;
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
};

function saveFulfillment(
  record: LiveCjFulfillmentRecord,
  updates: Partial<LiveCjFulfillmentRecord>,
): LiveCjFulfillmentRecord {
  return getLiveCjFulfillmentRepository().saveFulfillment({
    ...record,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

function syncPipelineFromFulfillment(
  fulfillment: LiveCjFulfillmentRecord,
  order: Order,
): void {
  const pipelineRepo = getCustomerOrderPipelineRepository();
  const pipeline = pipelineRepo.getPipelineById(fulfillment.pipelineId);
  if (!pipeline) return;

  pipelineRepo.savePipeline({
    ...pipeline,
    status:
      fulfillment.status === "DELIVERED"
        ? "DELIVERED"
        : fulfillment.status === "IN_TRANSIT" || fulfillment.status === "TRACKING_SYNCED"
          ? "IN_TRANSIT"
          : fulfillment.status === "SUBMITTED"
            ? "FULFILLMENT_REQUESTED"
            : pipeline.status,
    fulfillmentOrder: order,
    supplierOrderId: fulfillment.supplierOrderId,
    trackingNumber: fulfillment.trackingNumber,
    carrier: fulfillment.carrier,
    updatedAt: new Date().toISOString(),
  });
}

/** Prepares a LIVE CJ fulfillment job — PENDING_FOUNDER_APPROVAL, never auto-submits. */
export function prepareLiveCjFulfillment(
  input: PrepareLiveCjFulfillmentInput,
): LiveCjFulfillmentRecord {
  const repository = getLiveCjFulfillmentRepository();
  const existing = repository.getFulfillmentByPipelineId(input.pipelineId);
  if (existing && existing.status !== "FAILED" && existing.status !== "RECOVERABLE") {
    return existing;
  }

  const pipeline = getCustomerOrderPipelineRepository().getPipelineById(input.pipelineId);
  if (!pipeline?.fulfillmentOrder) {
    throw new Error(`Pipeline ${input.pipelineId} has no fulfillment order`);
  }
  if (
    pipeline.status !== "AWAITING_FULFILLMENT_APPROVAL" &&
    pipeline.fulfillmentOrder.status !== "APPROVED"
  ) {
    throw new Error(
      "Pipeline must be awaiting fulfillment approval or have an approved order",
    );
  }

  const env = loadLiveCjFulfillmentEnv();

  return repository.saveFulfillment(
    createFulfillmentRecord({
      pipelineId: pipeline.pipelineId,
      workspaceId: pipeline.workspaceId,
      companyId: pipeline.companyId,
      status: "PENDING_FOUNDER_APPROVAL",
      integrationMode: env.LIVE_CJ_FULFILLMENT_MOCK ? "MOCK_LIVE" : "LIVE",
      fulfillmentOrder: pipeline.fulfillmentOrder,
      supplierOrderId: null,
      trackingNumber: null,
      carrier: null,
      founderApprovalToken: null,
      approvedBy: null,
      approvedAt: null,
      attemptCount: 0,
      lastErrorMessage: null,
      lastTrackingSyncAt: null,
      mock: env.LIVE_CJ_FULFILLMENT_MOCK,
      metadata: { pipelineCorrelationId: pipeline.correlationId },
    }),
  );
}

/** Applies Grand King founder approval before LIVE CJ submit. */
export function applyFounderApproval(
  input: ApplyFounderApprovalInput,
): LiveCjFulfillmentRecord {
  const repository = getLiveCjFulfillmentRepository();
  const fulfillment = repository.getFulfillmentById(input.fulfillmentId);

  if (!fulfillment) {
    throw new Error(`Fulfillment ${input.fulfillmentId} not found`);
  }
  if (
    fulfillment.status !== "PENDING_FOUNDER_APPROVAL" &&
    fulfillment.status !== "RECOVERABLE"
  ) {
    throw new Error(`Fulfillment status ${fulfillment.status} cannot receive founder approval`);
  }

  const approvedOrder: Order = {
    ...fulfillment.fulfillmentOrder,
    approval: {
      approvalToken: input.approvalToken,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt,
      approved: true,
    },
    status: "APPROVED",
    updatedAt: new Date().toISOString(),
  };

  return saveFulfillment(fulfillment, {
    status: "APPROVED",
    fulfillmentOrder: approvedOrder,
    founderApprovalToken: input.approvalToken,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
  });
}

/** Executes LIVE CJ submit — explicit founder-approved action only. */
export async function executeLiveCjSubmit(
  fulfillmentId: string,
): Promise<LiveCjFulfillmentRecord> {
  const repository = getLiveCjFulfillmentRepository();
  let fulfillment = repository.getFulfillmentById(fulfillmentId);

  if (!fulfillment) {
    throw new Error(`Fulfillment ${fulfillmentId} not found`);
  }
  if (fulfillment.status !== "APPROVED") {
    throw new LiveCjFulfillmentBlockedError(
      `Fulfillment must be APPROVED before LIVE submit, got ${fulfillment.status}`,
    );
  }
  if (!isOrderApproved(fulfillment.fulfillmentOrder)) {
    throw new LiveCjFulfillmentBlockedError("Founder approval gate not satisfied on order");
  }

  fulfillment = saveFulfillment(fulfillment, { status: "SUBMITTING" });

  try {
    const result = await submitLiveCjOrder(fulfillment.fulfillmentOrder);

    const submittedOrder: Order = {
      ...fulfillment.fulfillmentOrder,
      status: "SUBMITTED",
      fulfillmentStatus: "SUBMITTED",
      supplierOrderId: result.supplierOrderId,
      trackingNumber: result.trackingNumber,
      integrationMode: "LIVE",
      updatedAt: new Date().toISOString(),
    };

    fulfillInventoryReservation(fulfillment.pipelineId);

    fulfillment = saveFulfillment(fulfillment, {
      status: "SUBMITTED",
      integrationMode: result.integrationMode,
      fulfillmentOrder: submittedOrder,
      supplierOrderId: result.supplierOrderId,
      trackingNumber: result.trackingNumber,
      mock: result.mock,
      attemptCount: fulfillment.attemptCount + 1,
    });

    fulfillment = recordSubmitSuccess(
      fulfillment,
      `LIVE CJ order submitted: ${result.supplierOrderId}`,
    );

    syncPipelineFromFulfillment(fulfillment, submittedOrder);
    return fulfillment;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    fulfillment = recordSubmitFailure(fulfillment, err);
    throw error;
  }
}

/** Syncs LIVE CJ tracking and updates fulfillment + pipeline status. */
export async function syncLiveCjTracking(
  fulfillmentId: string,
  options?: { markDelivered?: boolean },
): Promise<LiveCjFulfillmentRecord> {
  const repository = getLiveCjFulfillmentRepository();
  const fulfillment = repository.getFulfillmentById(fulfillmentId);

  if (!fulfillment?.supplierOrderId || !fulfillment.trackingNumber) {
    throw new Error(`Fulfillment ${fulfillmentId} has no supplier order to track`);
  }

  const snapshot = await fetchLiveCjTracking({
    supplierOrderId: fulfillment.supplierOrderId,
    trackingNumber: fulfillment.trackingNumber,
    deliverImmediately: options?.markDelivered,
  });

  const sync = syncTrackingFromSnapshot(
    { orderId: fulfillment.fulfillmentOrder.orderId },
    snapshot,
  );
  const updatedOrder = applyTrackingSync(fulfillment.fulfillmentOrder, sync);

  const nextStatus =
    sync.deliveryStatus === "DELIVERED"
      ? "DELIVERED"
      : sync.deliveryStatus === "FAILED"
        ? "FAILED"
        : sync.deliveryStatus === "IN_TRANSIT"
          ? "IN_TRANSIT"
          : "TRACKING_SYNCED";

  let updated = saveFulfillment(fulfillment, {
    status: nextStatus,
    fulfillmentOrder: updatedOrder,
    trackingNumber: sync.trackingNumber,
    carrier: sync.carrier,
    lastTrackingSyncAt: sync.syncedAt,
    lastErrorMessage: sync.deliveryStatus === "FAILED" ? "CJ reported delivery failure" : null,
  });

  syncPipelineFromFulfillment(updated, updatedOrder);

  if (nextStatus === "DELIVERED") {
    completePipelineDelivery(fulfillment.pipelineId);
    updated = repository.getFulfillmentById(fulfillmentId) ?? updated;
  }

  getLiveCjFulfillmentRepository().saveAttempt(
    createAttemptRecord({
      fulfillmentId: updated.fulfillmentId,
      attemptNumber: updated.attemptCount,
      phase: "tracking",
      outcome: nextStatus === "FAILED" ? "failed" : "success",
      message: `Tracking sync: ${sync.deliveryStatus}`,
      metadata: { trackingNumber: sync.trackingNumber },
    }),
  );

  return updated;
}

/** Founder-approved failure recovery — re-enables LIVE submit retry. */
export function recoverFailedFulfillment(
  input: ApplyFounderApprovalInput,
): LiveCjFulfillmentRecord {
  return prepareFailureRecovery(input);
}

export function getLiveCjFulfillmentById(
  fulfillmentId: string,
): LiveCjFulfillmentRecord | null {
  return getLiveCjFulfillmentRepository().getFulfillmentById(fulfillmentId);
}

export function getLiveCjFulfillmentByPipelineId(
  pipelineId: string,
): LiveCjFulfillmentRecord | null {
  return getLiveCjFulfillmentRepository().getFulfillmentByPipelineId(pipelineId);
}

export function listLiveCjFulfillments(workspaceId: string, companyId?: string) {
  return getLiveCjFulfillmentRepository().listFulfillments(workspaceId, companyId);
}

export { listFulfillmentAttempts };
