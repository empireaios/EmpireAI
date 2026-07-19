/** PILLOW-MHM-001 — Marketplace Health Monitor paths (R1-14). */

export const MARKETPLACE_HEALTH_MONITOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETPLACE_HEALTH_MONITOR_SYSTEM.md";

export const MHM_METADATA_VERSION = "MHM-001-v1" as const;

export const HEALTH_RECORD_SCHEMA_VERSION = "MHM-SCHEMA-001-v1" as const;

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
  "monitoring",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const API_AVAILABILITY_STATUSES = ["available", "degraded", "unavailable"] as const;
