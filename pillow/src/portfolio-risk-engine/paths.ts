/** PILLOW-PRE-001 — Portfolio Risk Engine paths (X2-07). */

export const PORTFOLIO_RISK_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PORTFOLIO_RISK_ENGINE_SYSTEM.md";

export const PRE_METADATA_VERSION = "PRE-001-v1" as const;

export const PORTFOLIO_RISK_ENGINE_ID = "portfolio-risk-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "monitoring",
  "analyzing",
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

export const RISK_CATEGORIES = [
  "enterprise",
  "company",
  "financial",
  "operational",
  "supplier_concentration",
  "customer_concentration",
] as const;

export const RISK_SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

export const PRE_CAPABILITIES = [
  "enterprise_risk_monitoring",
  "company_risk_monitoring",
  "financial_risk_analysis",
  "operational_risk_analysis",
  "supplier_concentration_risk_monitoring",
  "customer_concentration_risk_monitoring",
  "portfolio_risk_score_calculation",
  "emerging_risk_detection",
  "risk_mitigation_recommendations",
  "risk_validation",
  "risk_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
