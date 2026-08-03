/** PILLOW-ESE-001 — Enterprise Succession Engine (X5-13). */
export const ENTERPRISE_SUCCESSION_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_ENTERPRISE_SUCCESSION_ENGINE_SYSTEM.md" as const;
export const ENTERPRISE_SUCCESSION_ENGINE_ID = "enterprise-succession-engine" as const;
export const ESE_METADATA_VERSION = "ESE-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "planning", "assessing", "detecting", "evaluating", "recommending", "monitoring", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const CONTINUITY_STATUSES = ["ready", "partial", "at_risk", "gap_detected", "unknown"] as const;
export const RISK_LEVELS = ["low", "moderate", "elevated", "critical"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const ESE_CAPABILITIES = [
  "enterprise_continuity_plan_management",
  "executive_succession_plan_management",
  "organizational_knowledge_preservation",
  "governance_continuity_preservation",
  "operational_continuity_preservation",
  "succession_risk_detection",
  "continuity_gap_detection",
  "succession_readiness_evaluation",
  "continuity_recommendation_generation",
  "succession_metadata_generation",
  "succession_validation",
  "health_monitoring",
  "recovery_management",
] as const;
