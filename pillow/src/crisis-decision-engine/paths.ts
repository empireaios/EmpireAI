/** PILLOW-CDE-001 — Crisis Decision Engine paths (E2-08). */

export const CRISIS_DECISION_ENGINE_PATH =
  "docs/governance/EMPIREAI_CRISIS_DECISION_ENGINE.md";

export const CRISIS_PIPELINE = [
  "vision_synchronization",
  "crisis_detection",
  "severity_classification",
  "business_impact_analysis",
  "risk_assessment",
  "executive_recommendation",
  "approval_determination",
  "crisis_decision",
  "execution",
  "recovery_coordination",
  "post_crisis_review",
  "knowledge_integration",
] as const;

export const CRISIS_PRINCIPLES = [
  "vision_first",
  "constitution_first",
  "evidence_first",
  "executive_transparency",
  "rapid_response",
  "controlled_execution",
  "business_continuity",
  "no_constitutional_compromise",
] as const;

export const GOVERNED_CRISIS_DOMAINS = [
  "business_crises",
  "production_incidents",
  "infrastructure_failures",
  "security_events",
  "financial_emergencies",
  "commerce_disruptions",
  "supplier_failures",
  "critical_runtime_failures",
  "architecture_emergencies",
  "executive_escalations",
  "reputation_events",
  "future_crisis_categories",
] as const;

export const CRISIS_CLASSIFICATIONS = [
  "business",
  "production",
  "infrastructure",
  "security",
  "financial",
  "commerce",
  "operational",
  "architecture",
  "executive",
  "reputation",
  "runtime",
  "supplier",
] as const;

export const CRISIS_SEVERITY_LEVELS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitoring",
  "resolved",
] as const;

export const CRISIS_RESPONSE_DOMAINS = [
  "required_executive_authority",
  "immediate_actions",
  "resource_requirements",
  "recovery_strategy",
  "communication_plan",
  "business_continuity_actions",
  "executive_notifications",
] as const;

export const PILLOW_CRISIS_EVALUATIONS = [
  "crisis_severity",
  "response_options",
  "business_continuity",
  "recovery_strategies",
  "executive_recommendations",
  "strategic_risks",
] as const;
