import type { Order, OrderItem, TrackingEvent, TrackingEventStatus } from "../../../orders/index.js";
import { getCjSandboxProducts } from "../cj-sandbox-fixtures.js";
import type { CjOrderPayload, CjTrackingSnapshot } from "./cj-order-types.js";

const CJ_EVENT_STATUS_MAP: Record<string, TrackingEventStatus> = {
  LABEL_CREATED: "LABEL_CREATED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  EXCEPTION: "EXCEPTION",
  FAILED: "FAILED",
};

/** Builds CJ API order payload from an EmpireAI Order. */
export function buildOrderPayload(order: Order): CjOrderPayload {
  const address = order.shippingAddress;

  return {
    orderNumber: order.orderId,
    shippingCountryCode: address.countryCode,
    shippingProvince: address.state,
    shippingCity: address.city,
    shippingAddress: address.addressLine1,
    shippingCustomerName: address.fullName,
    shippingPhone: address.phone,
    shippingZip: address.postalCode,
    products: order.items.map((item) => ({
      vid: resolveVariantId(item),
      quantity: item.quantity,
    })),
    remark: `EmpireAI order ${order.orderId} — approval-gated fulfillment`,
    sandbox: order.integrationMode === "SANDBOX",
  };
}

function resolveVariantId(item: OrderItem): string {
  if (item.supplierProductId) {
    return item.supplierProductId;
  }
  const sandboxProduct = getCjSandboxProducts().find(
    (product) => product.productSku === item.supplierSku || product.pid === item.supplierSku,
  );
  const variant = sandboxProduct?.variants?.[0];
  return variant?.vid ?? item.supplierSku;
}

/** Maps CJ tracking snapshot into EmpireAI TrackingEvent records. */
export function mapCjTrackingToEvents(
  orderId: string,
  snapshot: CjTrackingSnapshot,
): TrackingEvent[] {
  return snapshot.events.map((event, index) => ({
    eventId: `${orderId}-track-${index + 1}`,
    orderId,
    trackingNumber: snapshot.trackingNumber,
    carrier: snapshot.carrier,
    status: mapCjEventStatus(event.status),
    description: event.description,
    location: event.location,
    occurredAt: event.occurredAt,
  }));
}

function mapCjEventStatus(raw: string): TrackingEventStatus {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, "_");
  return CJ_EVENT_STATUS_MAP[normalized] ?? "IN_TRANSIT";
}

/** Builds a sandbox tracking snapshot for simulated submissions. */
export function buildSandboxTrackingSnapshot(
  supplierOrderId: string,
  trackingNumber: string,
): CjTrackingSnapshot {
  const now = new Date().toISOString();
  return {
    supplierOrderId,
    trackingNumber,
    carrier: "CJ_SANDBOX_LOGISTICS",
    deliveryStatus: "IN_TRANSIT",
    events: [
      {
        status: "LABEL_CREATED",
        description: "Shipping label created (sandbox simulation).",
        location: "CJ Sandbox Warehouse",
        occurredAt: now,
      },
      {
        status: "IN_TRANSIT",
        description: "Package in transit (sandbox simulation).",
        location: "Distribution Hub",
        occurredAt: now,
      },
    ],
  };
}
