/** PILLOW-SPE-001 — Supplier Pricing Engine paths (R2-07). */

export const SUPPLIER_PRICING_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_PRICING_ENGINE_SYSTEM.md";

export const SPE_METADATA_VERSION = "SPE-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = [
  "cj-dropshipping",
  "aliexpress",
  "1688",
] as const;

export const SUPPORTED_CURRENCIES = ["USD", "CNY", "EUR", "GBP"] as const;

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
