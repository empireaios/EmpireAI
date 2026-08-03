/** PILLOW-EOE-001 — Empire Optimization Engine paths (X5-04). */
export const EMPIRE_OPTIMIZATION_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_EMPIRE_OPTIMIZATION_ENGINE_SYSTEM.md" as const;
export const EMPIRE_OPTIMIZATION_ENGINE_ID = "empire-optimization-engine" as const;
export const EOE_METADATA_VERSION = "EOE-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "monitoring", "analyzing", "optimizing", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const OPTIMIZATION_CATEGORIES = ["enterprise_performance", "cross_company_efficiency", "operational_bottleneck", "duplicated_effort", "resource_optimization", "optimization_opportunity"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const EOE_CAPABILITIES = [
  "enterprise_performance_monitoring", "cross_company_efficiency_analysis", "optimization_opportunity_detection",
  "operational_bottleneck_detection", "duplicated_effort_detection", "resource_optimization",
  "optimization_priority_ranking", "enterprise_optimization_recommendations", "optimization_outcome_tracking",
  "optimization_metadata_generation", "optimization_validation", "health_monitoring", "recovery",
] as const;
