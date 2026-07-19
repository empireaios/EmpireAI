/** PILLOW-RC-001 — Reconciliation Engine paths (R3-08). */

export const RECONCILIATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_RECONCILIATION_ENGINE_SYSTEM.md";

export const RC_METADATA_VERSION = "RC-001-v1" as const;

export const RECONCILIATION_ENGINE_ID = "reconciliation-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "reconciling",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const ENGINE_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const RECONCILIATION_STATUSES = [
  "pending",
  "matched",
  "partial",
  "mismatched",
  "failed",
] as const;

export const RC_CAPABILITIES = [
  "payment_reconciliation",
  "banking_reconciliation",
  "revenue_reconciliation",
  "expense_reconciliation",
  "cash_flow_reconciliation",
  "transaction_matching",
  "missing_transaction_detection",
  "duplicate_transaction_detection",
  "mismatch_detection",
  "reconciliation_reporting",
  "reconciliation_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
