/** PILLOW-TAL-001 — Global Talent Intelligence paths (X4-13). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_GLOBAL_TALENT_INTELLIGENCE_SYSTEM.md" as const;
export const GLOBAL_TALENT_INTELLIGENCE_SYSTEM_PATH = SYSTEM_PATH;

export const TAL_METADATA_VERSION = "TAL-001-v1" as const;
export const GLOBAL_TALENT_INTELLIGENCE_ID = "global-talent-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "evaluating",
  "analyzing",
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

export const WORKFORCE_CATEGORIES = [
  "global_workforce_availability",
  "regional_talent_market",
  "workforce_capability",
  "workforce_performance",
  "workforce_cost",
  "workforce_utilization",
  "workforce_shortage",
  "workforce_opportunity",
] as const;

export const DECISION_STATUSES = [
  "under_review",
  "partial",
  "rejected",
  "validated_ready",
  "unknown",
] as const;

export const RISK_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const TAL_CAPABILITIES = [
  "global_workforce_availability_monitoring",
  "regional_talent_market_monitoring",
  "workforce_capability_monitoring",
  "workforce_performance_monitoring",
  "workforce_cost_monitoring",
  "workforce_utilization_monitoring",
  "workforce_shortage_detection",
  "workforce_opportunity_detection",
  "workforce_recommendations",
  "workforce_intelligence_records",
  "workforce_validation",
  "workforce_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
