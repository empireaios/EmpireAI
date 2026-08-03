/** PILLOW-FSE-001 — Financial Scale Engine paths (X3-07). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_FINANCIAL_SCALE_ENGINE_SYSTEM.md" as const;
export const FINANCIAL_SCALE_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const FSE_METADATA_VERSION = "FSE-001-v1" as const;
export const FINANCIAL_SCALE_ENGINE_ID = "financial-scale-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "analyzing",
  "detecting",
  "recommending",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const OPERATIONAL_STATES = [
  "disconnected",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const FSE_CAPABILITIES = [
  "capital_requirements_monitoring",
  "cash_flow_readiness_monitoring",
  "profitability_monitoring",
  "working_capital_monitoring",
  "operating_expense_monitoring",
  "investment_efficiency_monitoring",
  "financial_bottleneck_detection",
  "capital_shortage_detection",
  "financial_scaling_recommendations",
  "financial_scaling_records",
  "financial_validation",
  "financial_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
