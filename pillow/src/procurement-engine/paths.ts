/** PILLOW-PCE-001 — Procurement Engine paths (R2-09). */

export const PROCUREMENT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PROCUREMENT_ENGINE_SYSTEM.md";

export const PCE_METADATA_VERSION = "PCE-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = [
  "cj-dropshipping",
  "aliexpress",
  "1688",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "procuring",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const PROCUREMENT_STATUSES = [
  "requested",
  "supplier_selected",
  "pending_approval",
  "approved",
  "purchase_order_created",
  "fulfilled",
  "failed",
  "cancelled",
] as const;

export const APPROVAL_STATUSES = ["pending", "approved", "rejected", "auto_approved"] as const;
