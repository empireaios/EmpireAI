/** PILLOW-AEE-001 — Accounting Export Engine paths (R3-17). */

export const ACCOUNTING_EXPORT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ACCOUNTING_EXPORT_ENGINE_SYSTEM.md";

export const AEE_METADATA_VERSION = "AEE-001-v1" as const;

export const ACCOUNTING_EXPORT_ENGINE_ID = "accounting-export-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "processing",
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

export const EXPORT_FORMATS = ["csv", "json", "quickbooks", "xero", "generic"] as const;

export const EXPORT_SCOPES = [
  "all",
  "revenue",
  "expense",
  "invoice",
  "refund",
  "tax",
  "reconciliation",
  "profit",
] as const;

export const EXPORT_STATUSES = ["pending", "completed", "partial", "failed"] as const;

export const AEE_CAPABILITIES = [
  "revenue_export",
  "expense_export",
  "invoice_export",
  "refund_export",
  "tax_export",
  "reconciliation_export",
  "multi_format_export",
  "export_validation",
  "failure_detection",
  "export_packaging",
  "export_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
