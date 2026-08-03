/** PILLOW-BHR-001 — Business Health Ranking paths (X2-09). */

export const BUSINESS_HEALTH_RANKING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_HEALTH_RANKING_SYSTEM.md";

export const BHR_METADATA_VERSION = "BHR-001-v1" as const;

export const BUSINESS_HEALTH_RANKING_ID = "business-health-ranking" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "ranking",
  "scoring",
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

export const BHR_CAPABILITIES = [
  "company_health_measurement",
  "operational_performance_ranking",
  "financial_performance_ranking",
  "growth_ranking",
  "customer_health_ranking",
  "operational_risk_ranking",
  "declining_business_detection",
  "high_performing_business_detection",
  "management_priority_generation",
  "business_health_record_generation",
  "ranking_status_reporting",
  "ranking_health_reporting",
  "ranking_failure_reporting",
  "business_health_validation",
  "business_health_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const MANAGEMENT_PRIORITIES = [
  "critical_attention",
  "high_attention",
  "monitor",
  "maintain",
  "scale",
] as const;
