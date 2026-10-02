/** Internal provider adapter: an explicit transport is mandatory. Public actions
 * must pass canonical commerce authority in cj-live-api-service before calling.
 * Tests supply in-memory HTTP fixtures; this module grants no execution authority.
 */
import type { Order } from "../../../orders/models/order.js";
import type { CjConfig } from "../../../suppliers/cj-dropshipping/cj-config.js";
import { createCjApiClient } from "../../../suppliers/cj-dropshipping/cj-api-client.js";
import { CJ_ORDER_ENDPOINTS } from "../../../suppliers/cj-dropshipping/orders/cj-order-client.js";
import { buildOrderPayload } from "../../../suppliers/cj-dropshipping/orders/cj-order-mapper.js";
import type { CjTrackingSnapshot } from "../../../suppliers/cj-dropshipping/orders/cj-order-types.js";
import { LiveCjFulfillmentBlockedError } from "./cj-live-errors.js";
import { LiveCjSubmissionUncertainError } from "./cj-submission-uncertain.js";
import type { LiveCjSubmitResult } from "./cj-live-api-service.js";

function parseCreateOrderResponse(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const nested = data.data as Record<string, unknown> | undefined;
    const orderId =
      nested?.orderId ??
      nested?.orderNum ??
      data.orderId ??
      data.orderNum ??
      data.cjOrderId;
    if (typeof orderId === "string" && orderId.trim()) return orderId.trim();
  }
  throw new LiveCjSubmissionUncertainError("CJ create response has no valid provider order ID. Submission outcome is unknown; reconcile before retrying.");
}

export async function submitProviderOrder(order: Order, cjConfig: CjConfig, fetchImpl: typeof fetch): Promise<LiveCjSubmitResult> {
  // Retrying a create after a lost response can duplicate a real order.
  const apiClient = createCjApiClient({ ...cjConfig, maxRetries: 0 }, fetchImpl);
  const payload = buildOrderPayload(order);

  let response: unknown;
  try {
    response = await apiClient.request<unknown>({
      method: "POST",
      path: CJ_ORDER_ENDPOINTS.ORDER_CREATE,
      body: { ...payload, sandbox: false },
      authenticated: true,
    });
  } catch {
    throw new LiveCjSubmissionUncertainError("CJ submission acknowledgement is unavailable. The provider may have received the order; reconcile before retrying.");
  }

  const supplierOrderId = parseCreateOrderResponse(response);

  return {
    supplierOrderId,
    trackingNumber: null,
    integrationMode: "LIVE",
    mock: false,
  };
}

export async function fetchProviderTracking(input: {supplierOrderId: string; trackingNumber: string}, cjConfig: CjConfig, fetchImpl: typeof fetch): Promise<CjTrackingSnapshot> {
  if (!input.supplierOrderId.trim() || !input.trackingNumber.trim()) {
    throw new LiveCjFulfillmentBlockedError("Provider order ID and a verified tracking number are required.");
  }

  const apiClient = createCjApiClient(cjConfig, fetchImpl);

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
    const trackingNumber = data.trackingNumber;
    const carrier = data.carrier;
    const rawStatus = data.deliveryStatus ?? data.status;
    if (typeof trackingNumber !== "string" || trackingNumber !== input.trackingNumber ||
      typeof carrier !== "string" || !carrier.trim() || typeof rawStatus !== "string" ||
      !["DELIVERED", "FAILED", "IN_TRANSIT"].includes(rawStatus.toUpperCase()) ||
      !Array.isArray(data.events) || data.events.length === 0) {
      throw new LiveCjFulfillmentBlockedError("CJ tracking proof is missing, mismatched or unsupported; shipment state is unconfirmed.");
    }
    const events = (data.events as Array<Record<string, unknown>>).map((event) => {
      if (!event || typeof event.status !== "string" || !event.status.trim() ||
        !["LABEL_CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "EXCEPTION", "FAILED"].includes(event.status.toUpperCase()) ||
        typeof event.description !== "string" || !event.description.trim() ||
        typeof event.occurredAt !== "string" || !Number.isFinite(Date.parse(event.occurredAt))) {
        throw new LiveCjFulfillmentBlockedError("CJ tracking event lacks source evidence; no event will be invented.");
      }
      return { status: event.status.toUpperCase(), description: event.description,
        location: typeof event.location === "string" ? event.location : null, occurredAt: event.occurredAt };
    });
    const deliveryStatus = rawStatus.toUpperCase() as "DELIVERED" | "FAILED" | "IN_TRANSIT";
    const latestTime = Math.max(...events.map((event) => Date.parse(event.occurredAt)));
    const latestEvents = events.filter((event) => Date.parse(event.occurredAt) === latestTime);
    if ((data.orderId != null && data.orderId !== input.supplierOrderId) ||
      (deliveryStatus === "DELIVERED" && !latestEvents.every((event) => event.status === "DELIVERED")) ||
      (deliveryStatus !== "DELIVERED" && latestEvents.some((event) => event.status === "DELIVERED"))) {
      throw new LiveCjFulfillmentBlockedError("CJ tracking does not substantiate this order's claimed delivery state.");
    }

    return {
      supplierOrderId: input.supplierOrderId,
      trackingNumber,
      carrier,
      deliveryStatus,
      events,
    };
  } catch (error) {
    if (error instanceof LiveCjFulfillmentBlockedError) throw error;
    throw new LiveCjFulfillmentBlockedError("CJ tracking could not be verified. Shipment state is unchanged; no transit or delivery event was invented.");
  }
}
