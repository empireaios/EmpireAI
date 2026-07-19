/** PILLOW-RM-001 — Return Management paths (R2-13). */

export const RETURN_MANAGEMENT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_RETURN_MANAGEMENT_SYSTEM.md";

export const RM_METADATA_VERSION = "RM-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = ["cj", "aliexpress", "1688"] as const;

export const SUPPORTED_CARRIER_IDENTIFIERS = ["usps", "ups", "fedex", "dhl"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "processing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const RETURN_REASONS = [
  "defective",
  "wrong_item",
  "not_as_described",
  "changed_mind",
  "damaged_in_transit",
  "other",
] as const;

export const RETURN_AUTHORIZATION_STATUSES = [
  "pending",
  "authorized",
  "denied",
  "expired",
] as const;

export const RETURN_SHIPMENT_STATUSES = [
  "pending",
  "label_generated",
  "in_transit",
  "received",
  "failed",
] as const;

export const RETURN_COMPLETION_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;
