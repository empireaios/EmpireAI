/** PILLOW-RQW-001 — Requirements Worker (Q6-02). */
export const REQUIREMENTS_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REQUIREMENTS_WORKER_SYSTEM.md" as const;
export const REQUIREMENTS_WORKER_ID = "requirements-worker" as const;
export const RQW_METADATA_VERSION = "RQW-001-v1" as const;
export const REQUIREMENTS_WORKER_REPORT_VERSION = "RQW-RPT-v1" as const;

export const REQUIREMENTS_WORKER_IDENTITY = {
  workerId: "wkr-requirements-01",
  workerName: "Requirements Worker",
  workerType: "analyst",
  department: "enterprise_platforms",
  factory: "enterprise-platform-factory",
  role: "role-analyst-requirements",
  reportingLine: ["wkr-requirements-01", "pillow"] as string[],
  skillProfile: [
    "skill-business-intent-analysis",
    "skill-stakeholder-identification",
    "skill-functional-requirements",
    "skill-non-functional-requirements",
    "skill-user-story-generation",
    "skill-use-case-generation",
    "skill-acceptance-criteria",
    "skill-assumption-risk-constraint-analysis",
    "skill-structural-requirements-reporting",
  ],
  approvedTools: ["requirements_ledger", "requirements_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving_intent",
  "identifying_stakeholders",
  "defining_objectives",
  "producing_functional",
  "producing_non_functional",
  "generating_stories",
  "generating_use_cases",
  "generating_acceptance",
  "identifying_risks",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported requirement artifact types (extensible). */
export const REQUIREMENT_TYPES = [
  "functional_requirements",
  "non_functional_requirements",
  "business_rules",
  "user_stories",
  "use_cases",
  "acceptance_criteria",
  "technical_constraints",
  "regulatory_constraints",
  "unknown",
] as const;

export const RESEARCH_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "enterprise_platform_factory_core",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const RQW_CAPABILITIES = [
  "receive_approved_business_intent",
  "identify_stakeholders",
  "define_business_objectives",
  "produce_functional_requirements",
  "produce_non_functional_requirements",
  "generate_user_stories",
  "generate_use_cases",
  "generate_acceptance_criteria",
  "identify_assumptions_risks_and_constraints",
  "produce_machine_readable_requirements_reports",
  "follow_approved_business_intent",
  "preserve_complete_traceability",
  "distinguish_requirements_from_assumptions",
  "validate_completeness_before_submission",
  "never_invent_unsupported_business_requirements",
  "never_design_architecture",
  "never_write_application_code",
  "never_deploy_software",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_enterprise_platform_factory_core",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "requirements_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
