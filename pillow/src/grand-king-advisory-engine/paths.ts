/** PILLOW-GKA-001 — Grand King Advisory Engine (X5-15). */
export const GRAND_KING_ADVISORY_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_GRAND_KING_ADVISORY_ENGINE_SYSTEM.md" as const;
export const GRAND_KING_ADVISORY_ENGINE_ID = "grand-king-advisory-engine" as const;
export const GKA_METADATA_VERSION = "GKA-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "analyzing", "identifying", "prioritizing", "recommending", "tracking", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const PRIORITY_LEVELS = ["low", "moderate", "high", "critical"] as const;
export const IMPACT_LEVELS = ["limited", "material", "significant", "transformational"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const GKA_CAPABILITIES = [
  "enterprise_performance_analysis",
  "strategic_opportunity_identification",
  "strategic_risk_identification",
  "executive_decision_prioritization",
  "capital_allocation_recommendations",
  "growth_initiative_recommendations",
  "optimization_initiative_recommendations",
  "governance_action_recommendations",
  "advisory_outcome_tracking",
  "advisory_metadata_generation",
  "advisory_validation",
  "health_monitoring",
  "recovery_management",
] as const;
