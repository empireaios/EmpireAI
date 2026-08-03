/** PILLOW-SDE-001 — Scaling Decision Engine paths (X3-03). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_SCALING_DECISION_ENGINE_SYSTEM.md" as const;
export const SCALING_DECISION_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const SDE_METADATA_VERSION = "SDE-001-v1" as const;
export const SCALING_DECISION_ENGINE_ID = "scaling-decision-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "evaluating",
  "assessing",
  "deciding",
  "ranking",
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

export const SDE_CAPABILITIES = [
  "scaling_candidate_evaluation",
  "product_readiness_assessment",
  "operational_readiness_assessment",
  "financial_readiness_assessment",
  "supplier_readiness_assessment",
  "market_readiness_assessment",
  "business_risk_evaluation",
  "scale_hold_reject_decision",
  "scaling_priority_ranking",
  "scaling_recommendations",
  "decision_validation",
  "decision_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const SCALING_DECISIONS = ["scale", "hold", "reject"] as const;
