/** PILLOW-STE-001 — Shipment Tracking Engine paths (R2-12). */

export const SHIPMENT_TRACKING_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SHIPMENT_TRACKING_ENGINE_SYSTEM.md";

export const STE_METADATA_VERSION = "STE-001-v1" as const;

export const SUPPORTED_CARRIER_IDENTIFIERS = ["usps", "ups", "fedex", "dhl"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "tracking",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const TRACKING_STATUSES = [
  "pending",
  "label_created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delayed",
  "failed",
  "exception",
] as const;

export const DELIVERY_MILESTONES = [
  "label_created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
] as const;

export const DELAY_STATUSES = ["none", "at_risk", "delayed"] as const;
