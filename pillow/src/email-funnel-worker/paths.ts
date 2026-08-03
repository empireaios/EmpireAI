/** PILLOW-EFW-001 — Email Funnel Worker (Q8-06). */
export const EMAIL_FUNNEL_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EMAIL_FUNNEL_WORKER_SYSTEM.md" as const;
export const EMAIL_FUNNEL_WORKER_ID = "email-funnel-worker" as const;
export const EFW_METADATA_VERSION = "EFW-001-v1" as const;
export const EMAIL_FUNNEL_REPORT_VERSION = "EFW-RPT-v1" as const;

export const EMAIL_FUNNEL_WORKER_IDENTITY = {
  workerId: "wkr-email-funnel-01",
  workerName: "Email Funnel Worker",
  workerType: "analyst",
  department: "affiliate",
  factory: "affiliate-factory",
  role: "role-analyst-email-funnel",
  reportingLine: ["wkr-email-funnel-01", "pillow"] as string[],
  skillProfile: [
    "skill-lead-magnet-generation",
    "skill-email-capture-strategy",
    "skill-welcome-sequence-generation",
    "skill-nurture-sequence-generation",
    "skill-conversion-cta-generation",
    "skill-funnel-stage-definition",
    "skill-funnel-version-history",
    "skill-evidence-classified-reporting",
  ],
  approvedTools: ["funnel_ledger", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_opportunity",
  "consuming_seo",
  "generating_lead_magnet",
  "generating_capture_strategy",
  "defining_stages",
  "generating_welcome_sequence",
  "generating_nurture_sequence",
  "generating_cta_strategy",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = [
  "draft",
  "funnel_ready",
  "sequences_ready",
  "ready_for_q807",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const FUNNEL_STAGE_TYPES = [
  "awareness",
  "capture",
  "welcome",
  "nurture",
  "recommend",
  "convert",
  "reengage",
] as const;

export const INTEGRATION_TARGETS = [
  "affiliate_factory_core",
  "affiliate_opportunity_worker",
  "review_content_worker",
  "seo_content_worker",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
] as const;

export const EFW_CAPABILITIES = [
  "consume_affiliate_opportunity_reports",
  "consume_seo_content_reports",
  "generate_lead_magnet_concepts",
  "generate_email_capture_strategies",
  "generate_automated_email_sequences",
  "generate_lead_nurturing_workflows",
  "generate_conversion_focused_ctas",
  "define_email_funnel_stages",
  "maintain_funnel_version_history",
  "produce_email_funnel_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "never_fabricate_conversion_or_performance_claims",
  "never_send_live_marketing_emails",
  "never_manage_email_infrastructure",
  "never_replace_analytics_worker",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q807_or_later",
  "integrate_affiliate_factory_core",
  "integrate_affiliate_opportunity_worker",
  "integrate_review_content_worker",
  "integrate_seo_content_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "email_funnel_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q807_consumable_contract",
] as const;
