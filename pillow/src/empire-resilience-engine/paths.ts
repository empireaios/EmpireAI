/** PILLOW-ERS-001 — Empire Resilience Engine (X5-08). */
export const EMPIRE_RESILIENCE_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_EMPIRE_RESILIENCE_ENGINE_SYSTEM.md" as const;
export const EMPIRE_RESILIENCE_ENGINE_ID = "empire-resilience-engine" as const;
export const ERS_METADATA_VERSION = "ERS-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "monitoring", "detecting", "assessing", "recommending", "recovering", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const ERS_CAPABILITIES = ["enterprise_resilience_monitoring", "operational_failure_detection", "infrastructure_failure_detection", "business_disruption_detection", "supply_chain_disruption_detection", "financial_disruption_detection", "resilience_assessment", "resilience_recommendations", "recovery_coordination", "resilience_metadata_generation", "resilience_validation", "health_monitoring", "recovery_management"] as const;
