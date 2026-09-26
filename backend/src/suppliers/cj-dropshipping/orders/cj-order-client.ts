import { isCjLiveEstimateContext } from "./cj-fulfillment-estimate-gate.js";
import type { Order } from "../../../orders/index.js";
import type { CjApiClient } from "../cj-api-client.js";
import type { CjConfig } from "../cj-config.js";
import { loadCjConfig } from "../cj-config.js";
import { getCjSandboxProducts } from "../cj-sandbox-fixtures.js";
import {
  recordDeliveryOutcome,
  recordFulfillmentOutcome,
  recordSubmissionAttempt,
} from "./cj-fulfillment-health.js";
import { buildOrderPayload } from "./cj-order-mapper.js";
import { syncSandboxTracking } from "./cj-tracking-sync.js";
import type {
  CjFulfillmentEstimate,
  CjOrderApprovalInput,
  CjOrderSubmissionResult,
} from "./cj-order-types.js";
import {
  assertSubmissionAllowed,
  CjOrderApprovalRequiredError,
  CjOrderSubmissionDisabledError,
  requireApprovedForSubmit,
  validateOrder,
} from "./cj-order-validation.js";

export const CJ_ORDER_ENDPOINTS = {
  ORDER_CREATE: "/shopping/order/createOrder",
  ORDER_QUERY: "/shopping/order/getOrderDetail",
  ORDER_TRACKING: "/logistic/trackInfo",
} as const;

export type CjOrderClientOptions = {
  config?: CjConfig;
  apiClient?: CjApiClient;
};

/** CJ Dropshipping order fulfillment client — submission is approval-gated. */
export class CjOrderClient {
  readonly config: CjConfig;

  constructor(options: CjOrderClientOptions = {}) {
    this.config = options.config ?? loadCjConfig();
  }

  /** Validates order without requiring approval. */
  validateOrder(order: Order) {
    return validateOrder(order);
  }

  /** Builds CJ API payload for an order. */
  buildOrderPayload(order: Order) {
    return buildOrderPayload(order);
  }

  /** Estimates fulfillment cost and delivery window (no charges, no submission). */
  async estimateFulfillment(order: Order): Promise<CjFulfillmentEstimate> {
    const validation = validateOrder(order);
    const issues = [...validation.issues];

    const currency = typeof order.currency === "string" && /^[A-Z]{3}$/.test(order.currency) ? order.currency : null;
    const liveIntent = isCjLiveEstimateContext(order, this.config);
    const itemCostsKnown = order.items.length > 0 && order.items.every(item =>
      Number.isFinite(item.unitCost) && item.unitCost >= 0 && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.currency === currency);
    const itemCost = itemCostsKnown ? order.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0) : NaN;
    const estimatedCents = Math.round((itemCost + 5.99) * 100);
    if (liveIntent || !currency || !Number.isFinite(itemCost) || !Number.isSafeInteger(estimatedCents)) {
      return {
        source: "UNAVAILABLE", liveQuoteVerified: false,
        estimatedCost: null, currency, estimatedDeliveryDaysMin: null, estimatedDeliveryDaysMax: null, shippingMethod: null,
        valid: false,
        issues: [...issues, liveIntent
          ? "Live CJ fulfillment cost, shipping service and delivery window are unknown: no provider quote was obtained; sandbox estimates cannot authorize live economics."
          : "Item costs, quantities or currency are unknown, invalid, or exceed safe integer cents; no fulfillment estimate can be calculated."],
      };
    }

    // Deliberate offline fixture only. Credentials cannot upgrade it to a live quote.
    const estimatedDeliveryDaysMin = 7;
    const estimatedDeliveryDaysMax = 14;
    const shippingMethod = "CJ_STANDARD_SANDBOX";

    const sandboxMatch = getCjSandboxProducts().find((product) =>
      order.items.some(
        (item) => item.supplierSku === product.productSku || item.supplierProductId === product.pid,
      ),
    );

    if (!sandboxMatch && order.integrationMode === "SANDBOX") {
      issues.push("No matching CJ sandbox catalog product for order items.");
    }

    return {
      source: "SANDBOX_FIXTURE", liveQuoteVerified: false,
      estimatedCost: estimatedCents / 100,
      currency,
      estimatedDeliveryDaysMin,
      estimatedDeliveryDaysMax,
      shippingMethod,
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Submits an order to CJ — DISABLED unless APPROVED=true with full approval gate.
   * Default SANDBOX: simulates submission without live API charges.
   * LIVE execution is blocked here; the controlled ledger must own admission.
   */
  async submitOrder(
    order: Order,
    approval?: CjOrderApprovalInput,
  ): Promise<CjOrderSubmissionResult> {
    requireApprovedForSubmit(order);

    const gate = approval ?? order.approval;
    if (!gate || gate.approved !== true) {
      throw new CjOrderApprovalRequiredError();
    }

    const mode = assertSubmissionAllowed(this.config, order);

    // This legacy client lacks durable admission/reconciliation. Do not let it
    // bypass the fulfillment ledger or manufacture successful provider receipts.
    if (mode === "LIVE") {
      throw new CjOrderSubmissionDisabledError("Legacy live submission is unavailable until provider receipt reconciliation is established. Use the controlled fulfillment ledger.");
    }

    try {
      recordSubmissionAttempt(true);
      recordFulfillmentOutcome(true);

      const supplierOrderId = `cj-sandbox-order-${order.orderId}`;
      const trackingNumber = `TRK-${order.orderId.slice(-8).toUpperCase()}`;

      syncSandboxTracking(order, supplierOrderId, trackingNumber);
      recordDeliveryOutcome(false);

      return {
        supplierOrderId,
        status: "SANDBOX_SIMULATED",
        integrationMode: mode,
        submittedAt: new Date().toISOString(),
        message: "Sandbox order simulated — no live charges or payment execution.",
      };
    } catch (error) {
      recordSubmissionAttempt(false);
      throw error;
    }
  }
}

/** Creates a CJ order client with optional config override. */
export function createCjOrderClient(options: CjOrderClientOptions = {}): CjOrderClient {
  return new CjOrderClient(options);
}

/** Re-export validation helpers for convenience. */
export {
  validateOrder,
  requireApprovedForSubmit,
  canSubmitOrder,
  assertSubmissionAllowed,
  CjOrderApprovalRequiredError,
  CjOrderSubmissionDisabledError,
} from "./cj-order-validation.js";
