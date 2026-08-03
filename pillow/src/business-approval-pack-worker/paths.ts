/** PILLOW-BAP-001 — Business Approval Pack Worker (Q2-09). */
export const BUSINESS_APPROVAL_PACK_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_APPROVAL_PACK_WORKER_SYSTEM.md" as const;
export const BUSINESS_APPROVAL_PACK_WORKER_ID = "business-approval-pack-worker" as const;
export const BAP_METADATA_VERSION = "BAP-001-v1" as const;
export const BUSINESS_APPROVAL_PACK_VERSION = "BAP-PCK-v1" as const;

export const BUSINESS_APPROVAL_PACK_WORKER_IDENTITY = {
  workerId: "wkr-business-approval-pack-01",
  workerName: "Business Approval Pack Worker",
  workerType: "analyst",
  department: "strategy",
  factory: "empire-builder-factory",
  role: "role-analyst-business-approval-pack",
  reportingLine: ["wkr-business-approval-pack-01", "pillow"] as string[],
  skillProfile: [
    "skill-executive-synthesis",
    "skill-decision-packaging",
    "skill-evidence-consolidation",
    "skill-recommendation-framing",
  ],
  approvedTools: ["approval_pack_composer", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "consolidating",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const BUSINESS_TYPES = [
  "media",
  "commerce",
  "local_cleaning",
  "affiliate",
  "digital_product",
  "local_services",
  "saas",
  "agency",
  "unknown",
] as const;

export const APPROVAL_RECOMMENDATIONS = ["Proceed", "Revise", "Reject"] as const;
export const EVIDENCE_KINDS = ["fact", "recommendation", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "business_model_generator",
  "market_research_worker",
  "opportunity_evaluation_worker",
  "business_blueprint_worker",
  "launch_plan_worker",
  "business_risk_worker",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const BAP_CAPABILITIES = [
  "receive_business_model",
  "receive_market_research_report",
  "receive_opportunity_evaluation_report",
  "receive_business_blueprint",
  "receive_launch_plan",
  "receive_business_risk_report",
  "consolidate_all_findings",
  "produce_executive_summary",
  "highlight_major_opportunities",
  "highlight_major_risks",
  "highlight_required_approvals",
  "highlight_unresolved_issues",
  "recommend_proceed_revise_reject",
  "produce_machine_readable_business_approval_pack",
  "preserve_complete_traceability",
  "never_alter_upstream_reports",
  "distinguish_facts_from_recommendations",
  "identify_unresolved_risks",
  "preserve_full_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_business_model_generator",
  "integrate_market_research_worker",
  "integrate_opportunity_evaluation_worker",
  "integrate_business_blueprint_worker",
  "integrate_launch_plan_worker",
  "integrate_business_risk_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "business_approval_pack_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
