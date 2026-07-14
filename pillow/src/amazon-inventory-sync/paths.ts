/** PILLOW-AMZINV-001 — Amazon Inventory Sync paths (R1-05). */

export const AMAZON_INVENTORY_SYNC_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AMAZON_INVENTORY_SYNC_SYSTEM.md";

export const AMAZON_INVENTORY_METADATA_VERSION = "AMZINV-001-v1" as const;

export const AMAZON_INVENTORY_MARKETPLACE_ID = "amazon" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "syncing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock", "unknown"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

/** SP-API FBA inventory endpoints (structural — no live HTTP in R1-05). */
export const AMAZON_INVENTORY_API_PATHS = {
  listInventory: "/fba/inventory/v1/summaries",
  getInventory: "/fba/inventory/v1/summaries/{sku}",
  updateInventory: "/fba/inventory/v1/items/{sku}",
} as const;
