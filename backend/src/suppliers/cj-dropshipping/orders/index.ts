export type {
  CjOrderPayload,
  CjOrderSubmissionResult,
  CjTrackingSnapshot,
  CjFulfillmentEstimate,
  CjOrderValidationResult,
  CjOrderApprovalInput,
} from "./cj-order-types.js";

export {
  validateOrder,
  validateApprovalGate,
  assertSubmissionAllowed,
  canSubmitOrder,
  requireApprovedForSubmit,
  CjOrderValidationError,
  CjOrderApprovalRequiredError,
  CjOrderSubmissionDisabledError,
} from "./cj-order-validation.js";

export {
  buildOrderPayload,
  mapCjTrackingToEvents,
  buildSandboxTrackingSnapshot,
} from "./cj-order-mapper.js";

export {
  CjOrderClient,
  createCjOrderClient,
  CJ_ORDER_ENDPOINTS,
} from "./cj-order-client.js";
export type { CjOrderClientOptions } from "./cj-order-client.js";

export {
  syncTrackingFromSnapshot,
  syncSandboxTracking,
  applyTrackingSync,
} from "./cj-tracking-sync.js";
export type { TrackingSyncResult } from "./cj-tracking-sync.js";

export {
  FULFILLMENT_HEALTH_TIERS,
  resetFulfillmentHealthTelemetry,
  recordSubmissionAttempt,
  recordFulfillmentOutcome,
  recordDeliveryOutcome,
  evaluateFulfillmentHealth,
} from "./cj-fulfillment-health.js";
export type {
  FulfillmentHealthTier,
  FulfillmentHealthMetrics,
  FulfillmentHealthReport,
} from "./cj-fulfillment-health.js";
