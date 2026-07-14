/** PILLOW-AMZO-001 — Amazon Order Management paths (R1-04). */

export const AMAZON_ORDER_MANAGEMENT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AMAZON_ORDER_MANAGEMENT_SYSTEM.md";

export const AMAZON_ORDER_METADATA_VERSION = "AMZO-001-v1" as const;

export const AMAZON_ORDER_MARKETPLACE_ID = "amazon" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "syncing",
  "processing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "unshipped",
  "partially_shipped",
  "shipped",
  "cancelled",
  "refunded",
  "fulfilled",
] as const;

export const FULFILMENT_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const SHIPPING_STATUSES = ["pending", "label_printed", "in_transit", "delivered", "unknown"] as const;

export const REFUND_STATUSES = ["none", "pending", "partial", "full"] as const;

export const CANCELLATION_STATUSES = ["none", "requested", "confirmed"] as const;

export const LIFECYCLE_EVENT_TYPES = [
  "order_created",
  "order_updated",
  "order_cancelled",
  "order_fulfilled",
  "order_refunded",
  "order_shipped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

/** SP-API orders endpoints (structural — no live HTTP in R1-04). */
export const AMAZON_ORDERS_API_PATHS = {
  listOrders: "/orders/v0/orders",
  getOrder: "/orders/v0/orders/{orderId}",
  getOrderItems: "/orders/v0/orders/{orderId}/orderItems",
} as const;
