/** PILLOW-DAE-001 — Decision Audit Engine paths (E2-13). */

export const DECISION_AUDIT_ENGINE_PATH =
  "docs/governance/EMPIREAI_DECISION_AUDIT_ENGINE.md";

export const AUDIT_PIPELINE = [
  "vision_synchronization",
  "decision_created",
  "evidence_recorded",
  "recommendation_recorded",
  "approval_recorded",
  "execution_recorded",
  "outcome_recorded",
  "impact_evaluation",
  "audit_verification",
  "knowledge_integration",
] as const;

export const AUDIT_PRINCIPLES = [
  "vision_first",
  "constitution_first",
  "evidence_first",
  "executive_transparency",
  "complete_traceability",
  "executive_accountability",
  "continuous_verification",
  "no_missing_evidence",
] as const;

export const GOVERNED_AUDIT_DOMAINS = [
  "strategic_decisions",
  "business_decisions",
  "financial_decisions",
  "commerce_decisions",
  "engineering_decisions",
  "architecture_decisions",
  "operational_decisions",
  "production_decisions",
  "investment_decisions",
  "governance_decisions",
  "executive_approvals",
  "executive_recommendations",
] as const;

export const AUDIT_CLASSIFICATIONS = [
  "strategic",
  "business",
  "financial",
  "commerce",
  "engineering",
  "architecture",
  "operational",
  "production",
  "governance",
  "investment",
  "emergency",
  "historical",
] as const;

export const AUDIT_CAPABILITIES = [
  "complete_traceability",
  "decision_timeline",
  "evidence_verification",
  "approval_verification",
  "outcome_verification",
  "historical_comparison",
  "impact_review",
  "executive_accountability",
] as const;

export const PILLOW_AUDIT_EVALUATIONS = [
  "decision_integrity",
  "audit_quality",
  "evidence_completeness",
  "historical_consistency",
  "executive_recommendations",
] as const;
