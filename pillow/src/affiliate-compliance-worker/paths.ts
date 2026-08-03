/** PILLOW-ACW-001 — Affiliate Compliance Worker (Q8-08). */
export const AFFILIATE_COMPLIANCE_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AFFILIATE_COMPLIANCE_WORKER_SYSTEM.md" as const;
export const AFFILIATE_COMPLIANCE_WORKER_ID = "affiliate-compliance-worker" as const;
export const ACW_METADATA_VERSION = "ACW-001-v1" as const;
export const AFFILIATE_COMPLIANCE_REPORT_VERSION = "ACW-RPT-v1" as const;

export const AFFILIATE_COMPLIANCE_WORKER_IDENTITY = {
  workerId: "wkr-affiliate-compliance-01",
  workerName: "Affiliate Compliance Worker",
  workerType: "compliance",
  department: "affiliate",
  factory: "affiliate-factory",
  role: "role-compliance-affiliate",
  reportingLine: ["wkr-affiliate-compliance-01", "pillow"] as string[],
  skillProfile: [
    "skill-consume-opportunity-reports",
    "skill-consume-review-content-reports",
    "skill-consume-seo-content-reports",
    "skill-affiliate-disclosure-validation",
    "skill-platform-policy-validation",
    "skill-disclaimer-verification",
    "skill-compliance-violation-detection",
    "skill-remediation-recommendations",
    "skill-compliance-history-preservation",
    "skill-evidence-classified-reporting",
  ],
  approvedTools: ["evidence_ledger", "policy_checklist", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_opportunity",
  "consuming_review",
  "consuming_seo",
  "validating_disclosures",
  "validating_platform_rules",
  "validating_disclaimers",
  "detecting_violations",
  "recommending_corrections",
  "assessing_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = [
  "draft",
  "evidence_ready",
  "assessment_ready",
  "ready_for_q809",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const FINDING_SEVERITIES = ["info", "low", "medium", "high", "critical", "unknown"] as const;
export const READINESS_STATUSES = [
  "not_ready",
  "needs_remediation",
  "ready_for_review",
  "approval_ready",
  "unknown",
] as const;
export const CHECK_STATUSES = ["pass", "fail", "partial", "unknown"] as const;

export const INTEGRATION_TARGETS = [
  "affiliate_factory_core",
  "affiliate_opportunity_worker",
  "comparison_site_worker",
  "review_content_worker",
  "seo_content_worker",
  "email_funnel_worker",
  "analytics_worker",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_registry",
  "worker_lifecycle",
  "worker_recovery_system",
] as const;

export const ACW_CAPABILITIES = [
  "consume_affiliate_opportunity_reports",
  "consume_review_content_reports",
  "consume_seo_content_reports",
  "validate_affiliate_disclosures",
  "validate_platform_policy_compliance",
  "validate_required_disclaimers",
  "detect_potential_compliance_violations",
  "recommend_corrective_actions",
  "maintain_compliance_audit_history",
  "produce_affiliate_compliance_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_compliance_audit_history",
  "never_fabricate_compliance_results",
  "never_provide_unverified_legal_conclusions",
  "never_publish_affiliate_content",
  "never_replace_legal_professionals",
  "never_override_programme_requirements",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q809_or_later",
  "integrate_affiliate_factory_core",
  "integrate_affiliate_opportunity_worker",
  "integrate_comparison_site_worker",
  "integrate_review_content_worker",
  "integrate_seo_content_worker",
  "integrate_email_funnel_worker",
  "integrate_analytics_worker",
  "integrate_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_recovery_system",
  "affiliate_compliance_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q809_consumable_contract",
] as const;
