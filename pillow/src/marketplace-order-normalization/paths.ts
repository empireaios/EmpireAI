/** PILLOW-MON-001 — Marketplace Order Normalization paths (R1-13). */

export const MARKETPLACE_ORDER_NORMALIZATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETPLACE_ORDER_NORMALIZATION_SYSTEM.md";

export const MON_METADATA_VERSION = "MON-001-v1" as const;

export const UNIFIED_ORDER_SCHEMA_VERSION = "MON-SCHEMA-001-v1" as const;

export const SUPPORTED_MARKETPLACE_IDENTIFIERS = [
  "amazon",
  "walmart",
  "etsy",
  "ebay",
  "tiktok-shop",
  "shopify",
  "woocommerce",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "normalizing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const NORMALIZATION_STATUSES = ["pending", "normalized", "partial", "failed", "invalid"] as const;
