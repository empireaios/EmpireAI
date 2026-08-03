/** PILLOW-AEE-001 — Acquisition Evaluation Engine paths (X2-15). */

export const ACQUISITION_EVALUATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ACQUISITION_EVALUATION_ENGINE_SYSTEM.md";

export const AEE_METADATA_VERSION = "AEE-001-v1" as const;

export const ACQUISITION_EVALUATION_ENGINE_ID = "acquisition-evaluation-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "discovering",
  "evaluating",
  "recommending",
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

export const AEE_CAPABILITIES = [
  "acquisition_candidate_discovery",
  "acquisition_opportunity_evaluation",
  "strategic_fit_evaluation",
  "financial_performance_evaluation",
  "operational_maturity_evaluation",
  "acquisition_risk_evaluation",
  "acquisition_value_estimation",
  "acquisition_opportunity_ranking",
  "acquisition_recommendations",
  "acquisition_validation",
  "acquisition_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const RECOMMENDATION_TYPES = [
  "pursue",
  "monitor",
  "pass",
  "diligence",
  "manual_review",
] as const;
