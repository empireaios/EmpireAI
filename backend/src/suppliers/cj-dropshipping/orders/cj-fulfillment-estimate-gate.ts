import type { Order } from "../../../orders/index.js";
import type { CjConfig } from "../cj-config.js";
import type { CjFulfillmentEstimate, CjSandboxFulfillmentEstimate } from "./cj-order-types.js";

export class CjFulfillmentEstimateUnavailableError extends Error {
  readonly code = "CJ_FULFILLMENT_ESTIMATE_UNAVAILABLE";
  constructor(readonly estimate: CjFulfillmentEstimate) {
    super(`Fulfillment preparation blocked: ${estimate.issues.join(" ") || "A valid explicit sandbox estimate is required; no live provider quote is available."}`);
    this.name = "CjFulfillmentEstimateUnavailableError";
  }
}

/** Narrow before arithmetic/persistence: JavaScript null * 100 must never turn
 * missing supplier costs into free fulfillment or a positive profit claim.
 * Passing this guard permits offline fixture calculations only, not commerce.
 */
export function requireCjSandboxEstimate(estimate: CjFulfillmentEstimate): asserts estimate is CjSandboxFulfillmentEstimate {
  if (estimate.source !== "SANDBOX_FIXTURE" || estimate.valid !== true || estimate.liveQuoteVerified !== false ||
      typeof estimate.estimatedCost !== "number" || !Number.isFinite(estimate.estimatedCost) || estimate.estimatedCost < 0 || !Number.isSafeInteger(Math.round(estimate.estimatedCost * 100)) ||
      typeof estimate.currency !== "string" || !/^[A-Z]{3}$/.test(estimate.currency) ||
      typeof estimate.estimatedDeliveryDaysMin !== "number" || !Number.isSafeInteger(estimate.estimatedDeliveryDaysMin) || estimate.estimatedDeliveryDaysMin < 0 ||
      typeof estimate.estimatedDeliveryDaysMax !== "number" || !Number.isSafeInteger(estimate.estimatedDeliveryDaysMax) || estimate.estimatedDeliveryDaysMax < estimate.estimatedDeliveryDaysMin) {
    throw new CjFulfillmentEstimateUnavailableError(estimate);
  }
}

/** A deployed runtime or either LIVE mode cannot use sandbox economics. */
export function isCjLiveEstimateContext(order: Pick<Order, "integrationMode">, config: CjConfig, env: NodeJS.ProcessEnv = process.env): boolean {
  return order.integrationMode === "LIVE" || config.integrationMode === "LIVE" || env.NODE_ENV === "production" ||
    Boolean(env.RAILWAY_ENVIRONMENT || env.RAILWAY_ENVIRONMENT_NAME || env.RAILWAY_SERVICE_NAME || env.RAILWAY_DEPLOYMENT_ID || env.VERCEL);
}

/** Re-check stale records before reuse/approval: previous numeric guesses do not
 * become a provider quote when a sandbox session is switched to LIVE. */
export function requireCjSandboxOrderContext(order: Pick<Order, "integrationMode" | "currency">, config: CjConfig): void {
  if (isCjLiveEstimateContext(order, config)) {
    throw new CjFulfillmentEstimateUnavailableError({
      source: "UNAVAILABLE", liveQuoteVerified: false, estimatedCost: null,
      currency: /^[A-Z]{3}$/.test(order.currency) ? order.currency : null,
      estimatedDeliveryDaysMin: null, estimatedDeliveryDaysMax: null, shippingMethod: null, valid: false,
      issues: ["Live CJ economics are unknown: a prior sandbox estimate is not provider quote evidence and cannot authorize fulfillment."],
    });
  }
}
