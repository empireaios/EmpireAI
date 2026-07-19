/** PILLOW-SRE-001 — Supplier Ranking Engine paths (R2-08). */

export const SUPPLIER_RANKING_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_RANKING_ENGINE_SYSTEM.md";

export const SRE_METADATA_VERSION = "SRE-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = [
  "cj-dropshipping",
  "aliexpress",
  "1688",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "ranking",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
