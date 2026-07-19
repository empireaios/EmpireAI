/** PILLOW-SCI-001 — Shipping Carrier Integration paths (R2-11). */

export const SHIPPING_CARRIER_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SHIPPING_CARRIER_INTEGRATION_SYSTEM.md";

export const SCI_METADATA_VERSION = "SCI-001-v1" as const;

export const SUPPORTED_CARRIER_IDENTIFIERS = ["usps", "ups", "fedex", "dhl"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "shipping",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const SHIPMENT_STATUSES = [
  "pending",
  "requested",
  "label_generated",
  "confirmed",
  "in_transit",
  "delivered",
  "failed",
  "cancelled",
] as const;
