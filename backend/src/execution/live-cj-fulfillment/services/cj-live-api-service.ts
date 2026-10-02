import type { Order } from "../../../orders/index.js";
import { isCjLiveApiEnabled, loadCjConfig } from "../../../suppliers/cj-dropshipping/cj-config.js";
import { createCjOrderClient } from "../../../suppliers/cj-dropshipping/orders/cj-order-client.js";
import type { CjTrackingSnapshot } from "../../../suppliers/cj-dropshipping/orders/cj-order-types.js";
import { isOrderApproved, validateOrder as validateOrderShape } from "../../../orders/models/order.js";
import { validateApprovalGate } from "../../../suppliers/cj-dropshipping/orders/cj-order-validation.js";
import { LiveCjFulfillmentBlockedError } from "./cj-live-errors.js";
import { submitProviderOrder, fetchProviderTracking } from "./cj-live-provider-adapter.js";
import { canonicalOperatingProjection } from "../../../orchestration/pillow-host/executive-fact-precedence.js";
import {
  isLiveCjFulfillmentAllowed,
  loadLiveCjFulfillmentEnv,
} from "../config/live-cj-fulfillment-env.js";

export { LiveCjFulfillmentBlockedError } from "./cj-live-errors.js";
export type LiveCjSubmitResult = {
  supplierOrderId: string;
  trackingNumber: string | null;
  integrationMode: "LIVE" | "MOCK_LIVE";
  mock: boolean;
};

function assertCanonicalCommerceAuthority(): void {
  const authority = canonicalOperatingProjection();
  if (!authority.realCommerceAuthorized || authority.birthStatus === "NOT_BORN") {
    throw new LiveCjFulfillmentBlockedError("Canonical commerce authority is LOCKED; Pillow is NOT_BORN. Environment flags and token-shaped approval fields do not grant live execution.");
  }
}

function assertLiveSubmitAllowed(): void {
  const env = loadLiveCjFulfillmentEnv();
  if (!isLiveCjFulfillmentAllowed(env)) {
    throw new LiveCjFulfillmentBlockedError(
      "LIVE_CJ_FULFILLMENT_ENABLED is false — Protect The Empire gate active. No automatic LIVE orders.",
    );
  }
}

/** Submits an approved order to CJ LIVE API — never called automatically. */
export async function submitLiveCjOrder(order: Order): Promise<LiveCjSubmitResult> {
  assertLiveSubmitAllowed();

  if (!isOrderApproved(order)) {
    throw new LiveCjFulfillmentBlockedError("Order must be founder-approved before LIVE CJ submit");
  }

  const env = loadLiveCjFulfillmentEnv();
  const cjConfig = loadCjConfig();
  validateOrderShape(order);
  validateApprovalGate(order);
  const liveOrder: Order = { ...order, integrationMode: "LIVE" };
  const validation = createCjOrderClient({ config: cjConfig }).validateOrder(liveOrder);
  if (!validation.valid) {
    throw new LiveCjFulfillmentBlockedError(`Order validation failed before submission: ${validation.issues.join("; ")}`);
  }

  if (env.LIVE_CJ_FULFILLMENT_MOCK) {
    const trackingNumber = `TRK-LIVE-${order.orderId.slice(-8).toUpperCase()}`;
    return {
      supplierOrderId: `cj-live-mock-${order.orderId}`,
      trackingNumber,
      integrationMode: "MOCK_LIVE",
      mock: true,
    };
  }
  assertCanonicalCommerceAuthority();
  if (!isCjLiveApiEnabled(cjConfig)) {
    throw new LiveCjFulfillmentBlockedError(
      "CJ live credentials required — set CJ_API_KEY and CJ_INTEGRATION_MODE=LIVE",
    );
  }

  return submitProviderOrder(liveOrder, cjConfig, fetch);
}

/** Fetches LIVE CJ tracking for a supplier order. */
export async function fetchLiveCjTracking(input: {
  supplierOrderId: string;
  trackingNumber: string;
  deliverImmediately?: boolean;
}): Promise<CjTrackingSnapshot> {
  const env = loadLiveCjFulfillmentEnv();
  const cjConfig = loadCjConfig();

  if (env.LIVE_CJ_FULFILLMENT_MOCK) {
    const deliveryStatus = input.deliverImmediately ? "DELIVERED" : "IN_TRANSIT";
    const now = new Date().toISOString();
    return {
      supplierOrderId: input.supplierOrderId,
      trackingNumber: input.trackingNumber,
      carrier: "CJ_LIVE_MOCK_LOGISTICS",
      deliveryStatus,
      events: [
        {
          status: "LABEL_CREATED",
          description: "LIVE mock label created",
          location: "CJ Warehouse",
          occurredAt: now,
        },
        {
          status: deliveryStatus,
          description:
            deliveryStatus === "DELIVERED"
              ? "LIVE mock delivery confirmed"
              : "LIVE mock in transit",
          location: deliveryStatus === "DELIVERED" ? "Customer Address" : "Distribution Hub",
          occurredAt: now,
        },
      ],
    };
  }

  if (!isCjLiveApiEnabled(cjConfig)) {
    throw new LiveCjFulfillmentBlockedError("Live CJ tracking requires LIVE credentials; no mock tracking will be substituted.");
  }
  assertCanonicalCommerceAuthority();
  return fetchProviderTracking(input, cjConfig, fetch);
}
