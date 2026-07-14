/** PILLOW-EGC-001 — Executive Governance Certification paths (E5-16). */

export const EXECUTIVE_GOVERNANCE_CERTIFICATION_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_GOVERNANCE_CERTIFICATION.md";

export const EGOC_CERTIFICATION_SCOPE = [
  { id: "E5-01", key: "enterprise_governance_framework", title: "Enterprise Governance Framework" },
  { id: "E5-02", key: "executive_constitutional_monitor", title: "Executive Constitutional Monitor" },
  { id: "E5-03", key: "enterprise_audit_engine", title: "Enterprise Audit Engine" },
  { id: "E5-04", key: "executive_compliance_engine", title: "Executive Compliance Engine" },
  { id: "E5-05", key: "executive_ethics_engine", title: "Executive Ethics Engine" },
  { id: "E5-06", key: "executive_accountability_engine", title: "Executive Accountability Engine" },
  { id: "E5-07", key: "executive_transparency_engine", title: "Executive Transparency Engine" },
  { id: "E5-08", key: "executive_exception_manager", title: "Executive Exception Manager" },
  { id: "E5-09", key: "enterprise_risk_governance", title: "Enterprise Risk Governance" },
  { id: "E5-10", key: "executive_review_board", title: "Executive Review Board" },
  { id: "E5-11", key: "executive_policy_evolution", title: "Executive Policy Evolution" },
  { id: "E5-12", key: "executive_trust_engine", title: "Executive Trust Engine" },
  { id: "E5-13", key: "enterprise_constitutional_guardian", title: "Enterprise Constitutional Guardian" },
  { id: "E5-14", key: "executive_resilience_engine", title: "Executive Resilience Engine" },
  { id: "E5-15", key: "grand_king_executive_cockpit", title: "Grand King Executive Cockpit" },
] as const;

export const EGOC_CERTIFICATION_GATES = [
  "enterprise_governance_framework_complete",
  "executive_constitutional_monitor_complete",
  "enterprise_audit_engine_complete",
  "executive_compliance_engine_complete",
  "executive_ethics_engine_complete",
  "executive_accountability_engine_complete",
  "executive_transparency_engine_complete",
  "executive_exception_manager_complete",
  "enterprise_risk_governance_complete",
  "executive_review_board_complete",
  "executive_policy_evolution_complete",
  "executive_trust_engine_complete",
  "enterprise_constitutional_guardian_complete",
  "executive_resilience_engine_complete",
  "grand_king_executive_cockpit_complete",
  "repository_integrity_preserved",
  "constitutional_compliance_confirmed",
] as const;

export const EGOC_CERTIFICATION_VALIDATIONS = [
  "enterprise_governance_framework",
  "executive_constitutional_monitor",
  "enterprise_audit_engine",
  "executive_compliance_engine",
  "executive_ethics_engine",
  "executive_accountability_engine",
  "executive_transparency_engine",
  "executive_exception_manager",
  "enterprise_risk_governance",
  "executive_review_board",
  "executive_policy_evolution",
  "executive_trust_engine",
  "enterprise_constitutional_guardian",
  "executive_resilience_engine",
  "grand_king_executive_cockpit",
] as const;

export const EGOC_INTEGRATION_VALIDATIONS = [
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
  "vie",
  "executive_intelligence",
  "financial_executive",
  "business_engines",
] as const;

export const EGOC_EXECUTIVE_QUALITY_DOMAINS = [
  "governance_completeness",
  "architecture_consistency",
  "repository_consistency",
  "executive_usability",
  "cross_system_integration",
  "constitution_integrity",
  "executive_visibility",
  "governance_stability",
  "strategic_traceability",
] as const;

export const EGOC_DEFECT_SEVERITIES = ["critical", "high", "medium", "low"] as const;

export const EGOC_DEFECT_CATEGORIES = [
  "governance",
  "architecture",
  "repository",
  "integration",
  "documentation",
] as const;
