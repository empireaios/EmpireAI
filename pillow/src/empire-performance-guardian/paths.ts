/** PILLOW-EPG-001 — Empire Performance Guardian (X5-18). */
export const EMPIRE_PERFORMANCE_GUARDIAN_SYSTEM_PATH = "docs/governance/EMPIREAI_EMPIRE_PERFORMANCE_GUARDIAN_SYSTEM.md" as const;
export const EMPIRE_PERFORMANCE_GUARDIAN_ID = "empire-performance-guardian" as const;
export const EPG_METADATA_VERSION = "EPG-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "monitoring", "analyzing", "detecting", "ranking", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ANOMALY_STATUSES = ["none", "watch", "degraded", "critical"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const EPG_CAPABILITIES = [
  "company_continuous_monitoring",
  "enterprise_kpi_monitoring",
  "operational_performance_monitoring",
  "financial_performance_monitoring",
  "customer_performance_monitoring",
  "strategic_objective_monitoring",
  "performance_degradation_detection",
  "critical_anomaly_detection",
  "enterprise_priority_ranking",
  "performance_recommendations",
  "performance_metadata_generation",
  "performance_validation",
  "health_monitoring",
  "recovery_management",
] as const;
