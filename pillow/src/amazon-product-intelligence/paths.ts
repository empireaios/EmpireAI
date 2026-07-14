/** PILLOW-AMZPI-001 — Amazon Product Intelligence paths (R1-03). */

export const AMAZON_PRODUCT_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AMAZON_PRODUCT_INTELLIGENCE_SYSTEM.md";

export const AMAZON_PRODUCT_METADATA_VERSION = "AMZPI-001-v1" as const;

export const AMAZON_PRODUCT_MARKETPLACE_ID = "amazon" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "syncing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const PRODUCT_STATUSES = ["active", "inactive", "suppressed", "unknown"] as const;

export const SYNCHRONIZATION_STATUSES = [
  "pending",
  "synced",
  "updated",
  "new",
  "inactive",
  "failed",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

/** SP-API catalog endpoints (structural — no live HTTP in R1-03). */
export const AMAZON_CATALOG_API_PATHS = {
  listItems: "/catalog/2022-04-01/items",
  getItem: "/catalog/2022-04-01/items/{asin}",
  listListings: "/listings/2021-08-01/items",
} as const;
