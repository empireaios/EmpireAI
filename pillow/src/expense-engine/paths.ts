/** PILLOW-EX-001 — Expense Engine paths (R3-05). */

export const EXPENSE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXPENSE_ENGINE_SYSTEM.md";

export const EX_METADATA_VERSION = "EX-001-v1" as const;

export const EXPENSE_ENGINE_ID = "expense-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "processing",
  "aggregating",
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

export const EXPENSE_SOURCES = [
  "supplier_payment",
  "shipping",
  "advertising",
  "platform_fee",
  "operational",
  "payment",
  "banking",
  "manual",
] as const;

export const EXPENSE_CATEGORIES = [
  "supplier_payment",
  "shipping",
  "advertising",
  "platform_fee",
  "operational",
  "recurring",
] as const;

export const EXPENSE_STATUSES = [
  "pending",
  "recorded",
  "aggregated",
  "failed",
] as const;

export const EX_CAPABILITIES = [
  "expense_event_recording",
  "supplier_payment_recording",
  "shipping_expense_recording",
  "advertising_expense_recording",
  "platform_fee_recording",
  "operational_expense_recording",
  "recurring_expense_tracking",
  "expense_category_tracking",
  "expense_aggregation",
  "expense_classification",
  "anomaly_detection",
  "expense_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
