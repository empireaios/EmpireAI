/** PILLOW-WI-001 — Warehouse Intelligence paths (R2-14). */

export const WAREHOUSE_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WAREHOUSE_INTELLIGENCE_SYSTEM.md";

export const WI_METADATA_VERSION = "WI-001-v1" as const;

export const WAREHOUSE_IDENTIFIERS = ["wh-east", "wh-west", "wh-central"] as const;

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

export const WAREHOUSE_STATUSES = [
  "optimal",
  "bottleneck",
  "shortage",
  "overstock",
  "degraded",
  "offline",
] as const;
