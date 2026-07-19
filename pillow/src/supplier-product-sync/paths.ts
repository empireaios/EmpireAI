/** PILLOW-SPS-001 — Supplier Product Sync paths (R2-05). */

export const SUPPLIER_PRODUCT_SYNC_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_PRODUCT_SYNC_SYSTEM.md";

export const SPS_METADATA_VERSION = "SPS-001-v1" as const;

export const SUPPLIER_PRODUCT_CATALOG_VERSION = "SPS-CATALOG-001-v1" as const;

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
  "invalid",
] as const;

export const PRODUCT_STATUSES = ["active", "discontinued", "unknown"] as const;
