/** PILLOW-CLVE-001 — Customer Lifetime Value Engine paths (R4-15). */

export const CUSTOMER_LIFETIME_VALUE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CUSTOMER_LIFETIME_VALUE_ENGINE_SYSTEM.md";

export const CLVE_METADATA_VERSION = "CLVE-001-v1" as const;

export const CUSTOMER_LIFETIME_VALUE_ENGINE_ID = "customer-lifetime-value-engine" as const;

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

export const VALUE_TIERS = ["standard", "high", "declining", "at_risk"] as const;

export const CLVE_CAPABILITIES = [
  "clv_calculation",
  "revenue_analysis",
  "profitability_analysis",
  "retention_analysis",
  "purchase_frequency_tracking",
  "average_order_value_tracking",
  "value_prediction",
  "high_value_identification",
  "declining_value_identification",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
