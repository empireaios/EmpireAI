import type { Order } from "../../../orders/index.js";
import type { CjApiClient } from "../cj-api-client.js";
import { createCjApiClient } from "../cj-api-client.js";
import type { CjConfig } from "../cj-config.js";
import { isCjLiveApiEnabled, loadCjConfig } from "../cj-config.js";
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
  private readonly apiClient: CjApiClient;

  constructor(options: CjOrderClientOptions = {}) {
    this.config = options.config ?? loadCjConfig();
    this.apiClient = options.apiClient ?? createCjApiClient(this.config);
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

    const itemCost = order.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
    const shippingEstimate = 5.99;
    const currency = order.currency || "USD";

    let estimatedDeliveryDaysMin = 7;
    let estimatedDeliveryDaysMax = 14;
    let shippingMethod = "CJ_STANDARD_SANDBOX";

    if (isCjLiveApiEnabled(this.config)) {
      shippingMethod = "CJ_STANDARD";
      estimatedDeliveryDaysMin = 5;
      estimatedDeliveryDaysMax = 12;
    }

    const sandboxMatch = getCjSandboxProducts().find((product) =>
      order.items.some(
        (item) => item.supplierSku === product.productSku || item.supplierProductId === product.pid,
      ),
    );

    if (!sandboxMatch && order.integrationMode === "SANDBOX") {
      issues.push("No matching CJ sandbox catalog product for order items.");
    }

    return {
      estimatedCost: Number((itemCost + shippingEstimate).toFixed(2)),
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
   * LIVE mode only when CJ_INTEGRATION_MODE=LIVE and approval exists.
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

    if (mode === "LIVE" && !isCjLiveApiEnabled(this.config)) {
      throw new CjOrderSubmissionDisabledError(
        "Live submission requires CJ_INTEGRATION_MODE=LIVE with valid credentials and approval.",
      );
    }

    const payload = buildOrderPayload({ ...order, integrationMode: mode });

    try {
      if (mode === "LIVE") {
        await this.apiClient.request({
          method: "POST",
          path: CJ_ORDER_ENDPOINTS.ORDER_CREATE,
          body: payload,
          authenticated: true,
        });
      }

      recordSubmissionAttempt(true);
      recordFulfillmentOutcome(true);

      const supplierOrderId =
        mode === "SANDBOX"
          ? `cj-sandbox-order-${order.orderId}`
          : `cj-live-order-${order.orderId}`;
      const trackingNumber = `TRK-${order.orderId.slice(-8).toUpperCase()}`;

      syncSandboxTracking(order, supplierOrderId, trackingNumber);
      recordDeliveryOutcome(false);

      return {
        supplierOrderId,
        status: mode === "SANDBOX" ? "SANDBOX_SIMULATED" : "SUBMITTED",
        integrationMode: mode,
        submittedAt: new Date().toISOString(),
        message:
          mode === "SANDBOX"
            ? "Sandbox order simulated — no live charges or payment execution."
            : "Order submitted to CJ with approval gate satisfied.",
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
