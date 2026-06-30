import { releaseInventoryReservation } from "../../../revenue/customer-order-pipeline/services/inventory-reservation-service.js";
import { loadLiveCjFulfillmentEnv } from "../config/live-cj-fulfillment-env.js";
import type { LiveCjFulfillmentRecord } from "../models/live-cj-fulfillment-record.js";
import {
  createAttemptRecord,
  getLiveCjFulfillmentRepository,
} from "../repositories/sqlite-live-cj-fulfillment-repository.js";

export class LiveCjRecoveryBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveCjRecoveryBlockedError";
  }
}

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

function logAttempt(
  fulfillment: LiveCjFulfillmentRecord,
  phase: "submit" | "tracking" | "recovery",
  outcome: "success" | "failed",
  message: string,
  metadata: Record<string, string> = {},
): void {
  getLiveCjFulfillmentRepository().saveAttempt(
    createAttemptRecord({
      fulfillmentId: fulfillment.fulfillmentId,
      attemptNumber: fulfillment.attemptCount,
      phase,
      outcome,
      message,
      metadata,
    }),
  );
}

/** Records a failed LIVE submit and marks fulfillment recoverable. */
export function recordSubmitFailure(
  fulfillment: LiveCjFulfillmentRecord,
  error: Error,
): LiveCjFulfillmentRecord {
  const config = loadLiveCjFulfillmentEnv();
  const nextAttempt = fulfillment.attemptCount + 1;
  const recoverable = nextAttempt < config.LIVE_CJ_FULFILLMENT_MAX_RETRY_ATTEMPTS;

  logAttempt(fulfillment, "submit", "failed", error.message, {
    attemptCount: String(nextAttempt),
  });

  const updated = saveFulfillment(fulfillment, {
    status: recoverable ? "RECOVERABLE" : "FAILED",
    attemptCount: nextAttempt,
    lastErrorMessage: error.message,
    founderApprovalToken: null,
    approvedBy: null,
    approvedAt: null,
  });

  if (!recoverable) {
    releaseInventoryReservation(fulfillment.pipelineId);
  }

  return updated;
}

/** Records successful LIVE submit attempt. */
export function recordSubmitSuccess(
  fulfillment: LiveCjFulfillmentRecord,
  message: string,
): LiveCjFulfillmentRecord {
  logAttempt(fulfillment, "submit", "success", message);
  return saveFulfillment(fulfillment, {
    lastErrorMessage: null,
  });
}

/** Prepares a failed/recoverable fulfillment for founder-approved retry. */
export function prepareFailureRecovery(input: {
  fulfillmentId: string;
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
}): LiveCjFulfillmentRecord {
  const repository = getLiveCjFulfillmentRepository();
  const fulfillment = repository.getFulfillmentById(input.fulfillmentId);

  if (!fulfillment) {
    throw new Error(`Fulfillment ${input.fulfillmentId} not found`);
  }
  if (fulfillment.status !== "RECOVERABLE" && fulfillment.status !== "FAILED") {
    throw new LiveCjRecoveryBlockedError(
      `Fulfillment status ${fulfillment.status} is not eligible for recovery`,
    );
  }

  const config = loadLiveCjFulfillmentEnv();
  if (fulfillment.attemptCount >= config.LIVE_CJ_FULFILLMENT_MAX_RETRY_ATTEMPTS) {
    throw new LiveCjRecoveryBlockedError("Maximum LIVE CJ retry attempts exceeded");
  }

  logAttempt(fulfillment, "recovery", "success", "Founder approved failure recovery retry", {
    approvedBy: input.approvedBy,
  });

  return saveFulfillment(fulfillment, {
    status: "APPROVED",
    founderApprovalToken: input.approvalToken,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    lastErrorMessage: null,
  });
}

export function listFulfillmentAttempts(fulfillmentId: string) {
  return getLiveCjFulfillmentRepository().listAttempts(fulfillmentId);
}
