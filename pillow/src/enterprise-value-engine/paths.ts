/** PILLOW-EVE-001 — Enterprise Value Engine paths (X2-19). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_ENTERPRISE_VALUE_ENGINE_SYSTEM.md";

export const ENTERPRISE_VALUE_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const EVE_METADATA_VERSION = "EVE-001-v1" as const;

export const ENTERPRISE_VALUE_ENGINE_ID = "enterprise-value-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "valuing",
  "analyzing",
  "recommending",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const OPERATIONAL_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const EVE_CAPABILITIES = [
  "enterprise_value_calculation",
  "company_valuation",
  "portfolio_valuation",
  "intrinsic_value_estimation",
  "market_value_estimation",
  "value_growth_measurement",
  "valuation_history_tracking",
  "valuation_anomaly_detection",
  "valuation_recommendations",
  "valuation_validation",
  "valuation_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALUATION_METHODOLOGIES = [
  "intrinsic",
  "market",
  "hybrid",
  "structural_composite",
] as const;

export const ANOMALY_SEVERITIES = ["low", "medium", "high"] as const;
