import type { Order } from "../../../orders/index.js";
import { createCjApiClient } from "../../../suppliers/cj-dropshipping/cj-api-client.js";
import { isCjLiveApiEnabled, loadCjConfig } from "../../../suppliers/cj-dropshipping/cj-config.js";
import { CJ_ORDER_ENDPOINTS, createCjOrderClient } from "../../../suppliers/cj-dropshipping/orders/cj-order-client.js";
import { buildOrderPayload } from "../../../suppliers/cj-dropshipping/orders/cj-order-mapper.js";
import type { CjTrackingSnapshot } from "../../../suppliers/cj-dropshipping/orders/cj-order-types.js";
import { isOrderApproved } from "../../../orders/models/order.js";
import {
  isLiveCjFulfillmentAllowed,
  loadLiveCjFulfillmentEnv,
} from "../config/live-cj-fulfillment-env.js";

export class LiveCjFulfillmentBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveCjFulfillmentBlockedError";
  }
}

export type LiveCjSubmitResult = {
  supplierOrderId: string;
  trackingNumber: string;
  integrationMode: "LIVE" | "MOCK_LIVE";
  mock: boolean;
};

function assertLiveSubmitAllowed(): void {
  const env = loadLiveCjFulfillmentEnv();
  if (!isLiveCjFulfillmentAllowed(env)) {
    throw new LiveCjFulfillmentBlockedError(
      "LIVE_CJ_FULFILLMENT_ENABLED is false — Protect The Empire gate active. No automatic LIVE orders.",
    );
  }
}

function parseCreateOrderResponse(payload: unknown, fallbackOrderId: string): string {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const nested = data.data as Record<string, unknown> | undefined;
    const orderId =
      nested?.orderId ??
      nested?.orderNum ??
      data.orderId ??
      data.orderNum ??
      data.cjOrderId;
    if (orderId) return String(orderId);
  }
  return `cj-live-order-${fallbackOrderId}`;
}

/** Submits an approved order to CJ LIVE API — never called automatically. */
export async function submitLiveCjOrder(order: Order): Promise<LiveCjSubmitResult> {
  assertLiveSubmitAllowed();

  if (!isOrderApproved(order)) {
    throw new LiveCjFulfillmentBlockedError("Order must be founder-approved before LIVE CJ submit");
  }

  const env = loadLiveCjFulfillmentEnv();
  const cjConfig = loadCjConfig();
  const liveOrder: Order = { ...order, integrationMode: "LIVE" };

  if (!isCjLiveApiEnabled(cjConfig)) {
    if (env.LIVE_CJ_FULFILLMENT_MOCK) {
      const trackingNumber = `TRK-LIVE-${order.orderId.slice(-8).toUpperCase()}`;
      return {
        supplierOrderId: `cj-live-mock-${order.orderId}`,
        trackingNumber,
        integrationMode: "MOCK_LIVE",
        mock: true,
      };
    }
    throw new LiveCjFulfillmentBlockedError(
      "CJ live credentials required — set CJ_API_KEY, CJ_API_SECRET, CJ_INTEGRATION_MODE=LIVE",
    );
  }

  const client = createCjOrderClient({ config: cjConfig });
  const apiClient = createCjApiClient(cjConfig);
  const payload = buildOrderPayload(liveOrder);

  const response = await apiClient.request<unknown>({
    method: "POST",
    path: CJ_ORDER_ENDPOINTS.ORDER_CREATE,
    body: { ...payload, sandbox: false },
    authenticated: true,
  });

  client.validateOrder(liveOrder);

  const supplierOrderId = parseCreateOrderResponse(response, order.orderId);
  const trackingNumber = `TRK-LIVE-${supplierOrderId.slice(-8).toUpperCase()}`;

  return {
    supplierOrderId,
    trackingNumber,
    integrationMode: "LIVE",
    mock: false,
  };
}

/** Fetches LIVE CJ tracking for a supplier order. */
export async function fetchLiveCjTracking(input: {
  supplierOrderId: string;
  trackingNumber: string;
  deliverImmediately?: boolean;
}): Promise<CjTrackingSnapshot> {
  const env = loadLiveCjFulfillmentEnv();
  const cjConfig = loadCjConfig();

  if (!isCjLiveApiEnabled(cjConfig)) {
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

  const apiClient = createCjApiClient(cjConfig);

  try {
    const response = await apiClient.request<Record<string, unknown>>({
      method: "GET",
      path: CJ_ORDER_ENDPOINTS.ORDER_TRACKING,
      query: {
        trackNumber: input.trackingNumber,
        orderId: input.supplierOrderId,
      },
      authenticated: true,
    });

    const data = (response.data ?? response) as Record<string, unknown>;
    const events = Array.isArray(data.events)
      ? (data.events as Array<Record<string, unknown>>).map((event) => ({
          status: String(event.status ?? "IN_TRANSIT"),
          description: String(event.description ?? "Tracking update"),
          location: event.location ? String(event.location) : null,
          occurredAt: String(event.occurredAt ?? new Date().toISOString()),
        }))
      : [];

    const rawStatus = String(data.deliveryStatus ?? data.status ?? "IN_TRANSIT").toUpperCase();
    const deliveryStatus =
      rawStatus.includes("DELIVER") ? "DELIVERED"
      : rawStatus.includes("FAIL") ? "FAILED"
      : "IN_TRANSIT";

    return {
      supplierOrderId: input.supplierOrderId,
      trackingNumber: String(data.trackingNumber ?? input.trackingNumber),
      carrier: String(data.carrier ?? "CJ_LOGISTICS"),
      deliveryStatus,
      events,
    };
  } catch {
    return {
      supplierOrderId: input.supplierOrderId,
      trackingNumber: input.trackingNumber,
      carrier: "CJ_LOGISTICS",
      deliveryStatus: "IN_TRANSIT",
      events: [
        {
          status: "IN_TRANSIT",
          description: "Tracking pending — CJ API returned no detail yet",
          location: null,
          occurredAt: new Date().toISOString(),
        },
      ],
    };
  }
}
