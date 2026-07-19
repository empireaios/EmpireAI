/** PILLOW-RE-001 — Revenue Engine paths (R3-04). */

export const REVENUE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REVENUE_ENGINE_SYSTEM.md";

export const RE_METADATA_VERSION = "RE-001-v1" as const;

export const REVENUE_ENGINE_ID = "revenue-engine" as const;

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

export const REVENUE_SOURCES = [
  "payment",
  "marketplace",
  "supplier_settlement",
  "refund",
  "manual",
] as const;

export const REVENUE_STATUSES = [
  "pending",
  "recorded",
  "aggregated",
  "refunded",
  "failed",
] as const;

export const RE_CAPABILITIES = [
  "revenue_event_recording",
  "completed_payment_recording",
  "marketplace_revenue_recording",
  "supplier_settlement_recording",
  "refund_recording",
  "gross_revenue_tracking",
  "net_revenue_tracking",
  "marketplace_revenue_tracking",
  "business_revenue_tracking",
  "anomaly_detection",
  "revenue_aggregation",
  "revenue_classification",
  "revenue_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
