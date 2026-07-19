/** PILLOW-MWS-001 — Multi-Warehouse Support paths (R2-15). */

export const MULTI_WAREHOUSE_SUPPORT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MULTI_WAREHOUSE_SUPPORT_SYSTEM.md";

export const MWS_METADATA_VERSION = "MWS-001-v1" as const;

export const WAREHOUSE_IDENTIFIERS = ["wh-east", "wh-west", "wh-central", "wh-north", "wh-south"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "coordinating",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const INVENTORY_TRANSFER_STATUSES = [
  "none",
  "pending",
  "in_transit",
  "completed",
  "failed",
] as const;

export const WAREHOUSE_HEALTH_STATUSES = [
  "healthy",
  "imbalanced",
  "capacity_issue",
  "degraded",
  "offline",
] as const;
