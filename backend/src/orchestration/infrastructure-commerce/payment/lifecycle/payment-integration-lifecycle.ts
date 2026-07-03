/**
 * G2-05 — Payment integration lifecycle (framework state machine — no real payments).
 */

import {
  PAYMENT_INTEGRATION_LIFECYCLE,
  type PaymentIntegrationLifecyclePhase,
  type PaymentLifecycleTransitionRequest,
  type PaymentLifecycleTransitionResult,
} from "../contracts/payment-integration-types.js";

const ALLOWED_TRANSITIONS: Record<
  PaymentIntegrationLifecyclePhase,
  PaymentIntegrationLifecyclePhase[]
> = {
  discover: ["validate", "archive"],
  validate: ["register", "discover", "archive"],
  register: ["authenticate", "validate", "archive"],
  authenticate: ["create_payment_intent", "register", "archive"],
  create_payment_intent: ["authorise", "authenticate", "archive"],
  authorise: ["capture", "create_payment_intent", "archive"],
  capture: ["refund", "payout", "reconcile", "monitor", "archive"],
  refund: ["reconcile", "monitor", "capture"],
  payout: ["reconcile", "monitor", "capture"],
  reconcile: ["monitor", "refund", "payout", "archive"],
  monitor: ["reconcile", "archive", "authorise"],
  archive: [],
};

export function canTransitionPaymentLifecycle(
  currentPhase: PaymentIntegrationLifecyclePhase,
  targetPhase: PaymentIntegrationLifecyclePhase,
): boolean {
  return ALLOWED_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false;
}

export function transitionPaymentLifecycle(
  currentPhase: PaymentIntegrationLifecyclePhase,
  request: PaymentLifecycleTransitionRequest,
): PaymentLifecycleTransitionResult {
  if (!request.pillowGovernance) {
    return {
      providerId: request.providerId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "Pillow governance required for payment lifecycle transitions",
    };
  }

  if (!request.actorId?.trim() || !request.workspaceId?.trim()) {
    return {
      providerId: request.providerId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "actorId and workspaceId are required for payment lifecycle transitions",
    };
  }

  if (!canTransitionPaymentLifecycle(currentPhase, request.targetPhase)) {
    return {
      providerId: request.providerId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} is not permitted`,
    };
  }

  return {
    providerId: request.providerId,
    previousPhase: currentPhase,
    currentPhase: request.targetPhase,
    allowed: true,
    reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} approved by framework`,
  };
}

export function listPaymentIntegrationLifecyclePhases(): readonly PaymentIntegrationLifecyclePhase[] {
  return PAYMENT_INTEGRATION_LIFECYCLE;
}
