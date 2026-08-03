/** PILLOW-GRI-001 — Global Risk Intelligence paths (X4-15). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_GLOBAL_RISK_INTELLIGENCE_SYSTEM.md" as const;
export const GLOBAL_RISK_INTELLIGENCE_SYSTEM_PATH = SYSTEM_PATH;

export const GRI_METADATA_VERSION = "GRI-001-v1" as const;
export const GLOBAL_RISK_INTELLIGENCE_ID = "global-risk-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "evaluating",
  "analyzing",
  "optimizing",
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

export const OPTIMIZATION_CATEGORIES = [
  "geopolitical",
  "economic",
  "regulatory",
  "operational",
  "logistics",
  "financial",
  "regional_business",
  "emerging_international",
  "global_risk_priority",
  "regional_business_performance",
  "regional_revenue_growth",
  "regional_profitability",
  "regional_customer_growth",
  "regional_operational_efficiency",
  "regional_growth_opportunity",
  "regional_performance_bottleneck",
  "regional_optimization_priority",
] as const;

export const OPTIMIZATION_STATUSES = [
  "under_review",
  "partial",
  "rejected",
  "validated_ready",
  "unknown",
] as const;

export const PRIORITY_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const GRI_CAPABILITIES = [
  "geopolitical_risk_monitoring",
  "economic_risk_monitoring",
  "regulatory_risk_monitoring",
  "operational_risk_monitoring",
  "logistics_risk_monitoring",
  "financial_risk_monitoring",
  "regional_business_risk_monitoring",
  "emerging_international_risk_detection",
  "global_risk_ranking",
  "risk_mitigation_recommendations",
  "global_risk_records",
  "global_risk_validation",
  "global_risk_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
