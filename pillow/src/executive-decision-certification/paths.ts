/** PILLOW-EDEC-001 — Executive Decision Certification paths (E2-16). */

export const EXECUTIVE_DECISION_CERTIFICATION_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_DECISION_CERTIFICATION.md";

export const EDEC_CERTIFICATION_SCOPE = [
  { id: "E2-01", key: "executive_decision_architecture", title: "Decision Architecture" },
  { id: "E2-02", key: "risk_assessment_engine", title: "Risk Assessment Engine" },
  { id: "E2-03", key: "decision_simulation_engine", title: "Decision Simulation Engine" },
  { id: "E2-04", key: "executive_recommendation_engine", title: "Executive Recommendation Engine" },
  { id: "E2-05", key: "resource_allocation_engine", title: "Resource Allocation Engine" },
  { id: "E2-06", key: "conflict_resolution_engine", title: "Conflict Resolution Engine" },
  { id: "E2-07", key: "executive_approval_intelligence", title: "Executive Approval Intelligence" },
  { id: "E2-08", key: "crisis_decision_engine", title: "Crisis Decision Engine" },
  { id: "E2-09", key: "executive_escalation_engine", title: "Executive Escalation Engine" },
  { id: "E2-10", key: "trade_off_analysis_engine", title: "Trade-off Analysis Engine" },
  { id: "E2-11", key: "executive_consensus_engine", title: "Executive Consensus Engine" },
  { id: "E2-12", key: "executive_policy_engine", title: "Executive Policy Engine" },
  { id: "E2-13", key: "decision_audit_engine", title: "Decision Audit Engine" },
  { id: "E2-14", key: "executive_confidence_engine", title: "Executive Confidence Engine" },
  { id: "E2-15", key: "autonomous_decision_monitor", title: "Autonomous Decision Monitor" },
] as const;

export const EDEC_CERTIFICATION_GATES = [
  "decision_architecture_complete",
  "risk_assessment_complete",
  "decision_simulation_complete",
  "executive_recommendation_complete",
  "resource_allocation_complete",
  "conflict_resolution_complete",
  "executive_approval_intelligence_complete",
  "crisis_decision_management_complete",
  "executive_escalation_complete",
  "trade_off_analysis_complete",
  "executive_consensus_complete",
  "executive_policy_complete",
  "decision_audit_complete",
  "executive_confidence_complete",
  "autonomous_decision_monitoring_complete",
  "repository_integrity_preserved",
  "constitutional_compliance_confirmed",
] as const;

export const EDEC_CERTIFICATION_VALIDATIONS = [
  "decision_architecture",
  "enterprise_risk_evaluation",
  "decision_simulation",
  "executive_recommendations",
  "resource_allocation",
  "conflict_resolution",
  "executive_approval_intelligence",
  "crisis_decision_management",
  "executive_escalation",
  "trade_off_analysis",
  "executive_consensus",
  "executive_policy",
  "decision_auditing",
  "executive_confidence",
  "autonomous_decision_monitoring",
] as const;

export const EDEC_INTEGRATION_VALIDATIONS = [
  "vision",
  "soul",
  "ctd",
  "constitution_hierarchy",
  "engineering_constitution",
  "canonical_architecture",
  "repository",
  "production_truth",
  "journey",
  "pillow",
  "ecc",
  "supervisor",
  "guardian",
  "business_factory",
  "commerce",
  "executive_cockpit",
  "executive_planning_programme",
] as const;

export const EDEC_EXECUTIVE_QUALITY_DOMAINS = [
  "decision_completeness",
  "decision_consistency",
  "architecture_consistency",
  "executive_usability",
  "cross_system_integration",
  "policy_compliance",
  "decision_explainability",
  "executive_transparency",
  "strategic_traceability",
] as const;

export const EDEC_DEFECT_SEVERITIES = ["critical", "high", "medium", "low"] as const;

export const EDEC_DEFECT_CATEGORIES = [
  "decision",
  "architecture",
  "repository",
  "integration",
  "documentation",
] as const;
