/** PILLOW-TX-001 — Tax Intelligence Engine paths (R3-11). */

export const TAX_INTELLIGENCE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TAX_INTELLIGENCE_ENGINE_SYSTEM.md";

export const TX_METADATA_VERSION = "TX-001-v1" as const;

export const TAX_INTELLIGENCE_ENGINE_ID = "tax-intelligence-engine" as const;

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

export const TAX_STATUSES = [
  "pending",
  "classified",
  "calculated",
  "adjusted",
  "obligation",
  "paid",
  "failed",
  "voided",
] as const;

export const TAX_CATEGORIES = [
  "sales_tax",
  "vat",
  "income_tax",
  "deductible",
  "refund_adjustment",
  "withholding",
] as const;

export const TX_CAPABILITIES = [
  "taxable_transaction_classification",
  "tax_liability_calculation",
  "tax_adjustment_calculation",
  "multi_jurisdiction_support",
  "multi_rate_support",
  "tax_obligation_tracking",
  "tax_payment_tracking",
  "anomaly_detection",
  "tax_summary_generation",
  "tax_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
