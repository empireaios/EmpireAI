/** PILLOW-MPN-001 — Marketplace Product Normalization paths (R1-12). */

export const MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM.md";

export const MPN_METADATA_VERSION = "MPN-001-v1" as const;

export const UNIFIED_PRODUCT_SCHEMA_VERSION = "MPN-SCHEMA-001-v1" as const;

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
