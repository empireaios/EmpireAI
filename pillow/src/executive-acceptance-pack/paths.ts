/** PILLOW-EAPRT-001 — Executive Acceptance Pack (Q11-09). Ninth Q11 acceptance gate. */
export const EXECUTIVE_ACCEPTANCE_PACK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_ACCEPTANCE_PACK_SYSTEM.md" as const;
export const EXECUTIVE_ACCEPTANCE_PACK_ID = "executive-acceptance-pack" as const;
export const EAPRT_METADATA_VERSION = "EAPRT-001-v1" as const;
export const EXECUTIVE_ACCEPTANCE_PACK_REPORT_VERSION = "EAPRT-RPT-v1" as const;
export const EAPRT_MISSION_ID = "Q11-09" as const;
export const EXECUTIVE_ACCEPTANCE_PACK_RUNTIME_VERSION = "Q11-EAPRT-v1" as const;

export const EXECUTIVE_ACCEPTANCE_PACK_IDENTITY = {
  workerId: "wkr-executive-acceptance-pack-01",
  workerName: "Executive Acceptance Pack",
  workerType: "auditor",
  department: "executive_acceptance_pack",
  factory: "executive-acceptance-pack",
  role: "role-auditor-executive-acceptance-pack",
  reportingLine: ["wkr-executive-acceptance-pack-01", "pillow"] as string[],
  skillProfile: [
    "skill-certification-report-aggregation",
    "skill-audit-report-aggregation",
    "skill-production-readiness-evidence",
    "skill-executive-summary-generation",
    "skill-outstanding-issue-analysis",
    "skill-deployment-recommendation",
    "skill-production-readiness-classification",
    "skill-executive-checklist-production",
    "skill-executive-acceptance-pack-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "collecting_certifications",
  "collecting_audits",
  "collecting_readiness_evidence",
  "generating_executive_summary",
  "classifying_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const READINESS_CLASSIFICATIONS = [
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
] as const;

export const READINESS_DECISIONS = ["certify", "withhold", "escalate", "defer"] as const;

export const AUDIT_STATUSES = [
  "draft",
  "evidence_collected",
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const CERTIFICATION_SOURCES = [
  "production-certification-core",
  "shared-runtime-certification",
] as const;

export const AUDIT_SOURCES = [
  "worker-readiness-audit",
  "pillow-command-audit",
  "business-factory-audit",
  "security-audit",
  "performance-audit",
  "recovery-audit",
  "financial-readiness-audit",
] as const;

export const REQUIRED_AUDIT_SOURCES = [
  "worker-readiness-audit",
  "pillow-command-audit",
  "business-factory-audit",
  "security-audit",
  "performance-audit",
  "recovery-audit",
] as const;

export const OPTIONAL_AUDIT_SOURCES = ["financial-readiness-audit"] as const;

export const READINESS_EVIDENCE_SOURCES = [
  "monitoring-runtime",
  "audit-runtime",
  "executive-reporting-runtime",
] as const;

export const INTEGRATION_TARGETS = [
  "financial_readiness_audit",
  "production_certification_core",
  "shared_runtime_certification",
  "worker_readiness_audit",
  "pillow_command_audit",
  "business_factory_audit",
  "security_audit",
  "performance_audit",
  "recovery_audit",
  "executive_reporting_runtime",
  "audit_runtime",
  "monitoring_runtime",
] as const;

export const EAPRT_CAPABILITIES = [
  "collect_certification_reports",
  "collect_audit_reports",
  "collect_production_readiness_evidence",
  "generate_executive_summary",
  "generate_outstanding_issue_summary",
  "generate_deployment_recommendation",
  "classify_production_readiness",
  "produce_executive_checklist",
  "produce_executive_acceptance_pack_report",
  "assemble_pack",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1110_consumable_contract",
  "consume_q1109_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_pack_history",
  "preserve_audit_history",
  "never_fabricate_acceptance_evidence",
  "never_hide_failed_audits",
  "never_approve_production_deployment",
  "never_override_failed_certifications",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1110_or_later",
  "deterministic_pack_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "ninth_q11_gate",
] as const;
