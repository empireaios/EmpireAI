/** PILLOW-SIS-001 — Supplier Inventory Sync paths (R2-06). */

export const SUPPLIER_INVENTORY_SYNC_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_INVENTORY_SYNC_SYSTEM.md";

export const SIS_METADATA_VERSION = "SIS-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = [
  "cj-dropshipping",
  "aliexpress",
  "1688",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "syncing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const SYNCHRONIZATION_STATUSES = [
  "pending",
  "synchronized",
  "partial",
  "failed",
] as const;

export const STOCK_AVAILABILITY_STATUSES = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "discontinued",
] as const;

export const LOW_STOCK_THRESHOLD = 10;
