/** PILLOW-DE-001 — Decision Engine (Q0-05). */
export const DECISION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DECISION_ENGINE_SYSTEM.md" as const;
export const DECISION_ENGINE_ID = "decision-engine" as const;
export const DE_METADATA_VERSION = "DE-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "generating_options",
  "evaluating",
  "recommending",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default evaluation criteria (Q0-05).
 * Architecture allows additional criteria via configuration without redesign.
 */
export const EVALUATION_CRITERIA = [
  "business_value",
  "strategic_alignment",
  "cost",
  "complexity",
  "risk",
  "time",
  "resource_requirement",
  "probability_of_success",
] as const;

export const CRITERION_LABELS: Record<(typeof EVALUATION_CRITERIA)[number], string> = {
  business_value: "Business Value",
  strategic_alignment: "Strategic Alignment",
  cost: "Cost",
  complexity: "Complexity",
  risk: "Risk",
  time: "Time",
  resource_requirement: "Resource Requirement",
  probability_of_success: "Probability of Success",
};

/** Lower raw values are better for these criteria; scores are inverted to a 0–100 benefit scale. */
export const INVERTED_CRITERIA = [
  "cost",
  "complexity",
  "risk",
  "time",
  "resource_requirement",
] as const;

export const DE_CAPABILITIES = [
  "accept_executive_problem",
  "generate_candidate_options",
  "evaluate_options",
  "compare_trade_offs",
  "score_business_value",
  "score_strategic_alignment",
  "score_cost",
  "score_complexity",
  "score_risk",
  "score_time",
  "score_resource_requirement",
  "score_probability_of_success",
  "produce_confidence_scores",
  "explain_recommendation",
  "identify_risks",
  "identify_assumptions",
  "identify_missing_information",
  "produce_decision_package",
  "machine_readable_decision_output",
  "extensible_evaluation_criteria",
  "preserve_auditability",
  "preserve_traceability",
  "decision_validation",
  "health_monitoring",
  "recovery_management",
] as const;
