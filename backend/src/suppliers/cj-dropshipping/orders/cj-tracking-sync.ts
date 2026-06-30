import type { Order, TrackingEvent } from "../../../orders/index.js";
import { buildSandboxTrackingSnapshot, mapCjTrackingToEvents } from "./cj-order-mapper.js";
import type { CjTrackingSnapshot } from "./cj-order-types.js";

export type TrackingSyncResult = {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  deliveryStatus: CjTrackingSnapshot["deliveryStatus"];
  events: TrackingEvent[];
  syncedAt: string;
};

/** Synchronizes tracking data from a CJ snapshot into order tracking events. */
export function syncTrackingFromSnapshot(
  order: Pick<Order, "orderId">,
  snapshot: CjTrackingSnapshot,
): TrackingSyncResult {
  const events = mapCjTrackingToEvents(order.orderId, snapshot);

  return {
    orderId: order.orderId,
    trackingNumber: snapshot.trackingNumber,
    carrier: snapshot.carrier,
    deliveryStatus: snapshot.deliveryStatus,
    events,
    syncedAt: new Date().toISOString(),
  };
}

/** Returns sandbox tracking sync for a simulated CJ order. */
export function syncSandboxTracking(
  order: Pick<Order, "orderId">,
  supplierOrderId: string,
  trackingNumber: string,
): TrackingSyncResult {
  const snapshot = buildSandboxTrackingSnapshot(supplierOrderId, trackingNumber);
  return syncTrackingFromSnapshot(order, snapshot);
}

/** Applies tracking sync result onto an order record (immutable copy). */
export function applyTrackingSync(order: Order, sync: TrackingSyncResult): Order {
  const fulfillmentStatus =
    sync.deliveryStatus === "DELIVERED"
      ? "DELIVERED"
      : sync.deliveryStatus === "FAILED"
        ? "FAILED"
        : sync.deliveryStatus === "IN_TRANSIT"
          ? "IN_TRANSIT"
          : order.fulfillmentStatus;

  const status =
    sync.deliveryStatus === "DELIVERED"
      ? "DELIVERED"
      : sync.deliveryStatus === "FAILED"
        ? "FAILED"
        : order.status;

  return {
    ...order,
    trackingNumber: sync.trackingNumber,
    carrier: sync.carrier,
    trackingEvents: sync.events,
    fulfillmentStatus,
    status,
    updatedAt: sync.syncedAt,
  };
}
