/** PILLOW-FO-001 — Fulfilment Orchestrator paths (R2-10). */

export const FULFILMENT_ORCHESTRATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FULFILMENT_ORCHESTRATOR_SYSTEM.md";

export const FO_METADATA_VERSION = "FO-001-v1" as const;

export const SUPPORTED_SUPPLIER_IDENTIFIERS = [
  "cj-dropshipping",
  "aliexpress",
  "1688",
] as const;

export const FULFILMENT_ROUTES = [
  "direct_supplier",
  "dropship_express",
  "warehouse_dispatch",
  "standard_fulfilment",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "routing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const FULFILMENT_STATUSES = [
  "pending",
  "routed",
  "in_progress",
  "fulfilled",
  "failed",
  "blocked",
  "cancelled",
] as const;

export const FAILURE_STATUSES = ["none", "supplier_unavailable", "invalid_route", "workflow_blocked", "routing_failed"] as const;
