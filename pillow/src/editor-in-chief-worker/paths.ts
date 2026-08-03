/** PILLOW-ECW-001 — Editor-in-Chief Worker (Q4-02). */

export const EDITOR_IN_CHIEF_WORKER_SYSTEM_PATH =

  "docs/governance/EMPIREAI_EDITOR_IN_CHIEF_WORKER_SYSTEM.md" as const;

export const EDITOR_IN_CHIEF_WORKER_ID = "editor-in-chief-worker" as const;

export const ECW_METADATA_VERSION = "ECW-001-v1" as const;

export const EDITORIAL_REPORT_VERSION = "ECW-RPT-v1" as const;



export const EDITOR_IN_CHIEF_WORKER_IDENTITY = {

  workerId: "wkr-editor-in-chief-01",

  workerName: "Editor-in-Chief Worker",

  workerType: "executive_editor",

  department: "media",

  factory: "media-factory",

  role: "role-executive-editor-in-chief",

  reportingLine: ["wkr-editor-in-chief-01", "pillow"] as string[],

  skillProfile: [

    "skill-editorial-direction",

    "skill-channel-identity",

    "skill-audience-definition",

    "skill-editorial-tone",

    "skill-content-standards",

    "skill-publishing-priorities",

    "skill-content-quality-review",

    "skill-brand-consistency",

    "skill-long-term-content-strategy",

    "skill-editorial-approval",

  ],

  approvedTools: ["editorial_ledger", "standards_registry", "structured_reporting"],

  authorityLevel: "autonomous_worker_decision",

} as const;



export const ENGINE_STATUSES = [

  "idle",

  "connecting",

  "active",

  "directing",

  "defining",

  "reviewing",

  "approving",

  "reporting",

  "validating",

  "failed",

] as const;



export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;



export const EDITORIAL_TONES = [

  "authoritative",

  "educational",

  "conversational",

  "premium",

  "playful",

  "investigative",

  "inspirational",

  "neutral",

] as const;



export const REVIEW_OUTCOMES = [

  "approved",

  "revise",

  "rejected",

  "pending_review",

  "blocked_boundary",

] as const;



export const BRAND_CONSISTENCY = [

  "consistent",

  "minor_drift",

  "inconsistent",

  "unknown",

] as const;



export const APPROVAL_STATUSES = [

  "pending",

  "approved",

  "rejected",

  "deferred",

] as const;



export const CONTENT_STANDARD_CATEGORIES = [

  "accuracy",

  "originality",

  "tone_alignment",

  "audience_fit",

  "brand_safety",

  "production_quality",

  "legal_compliance",

] as const;



export const INTEGRATION_TARGETS = [

  "worker_registry",

  "worker_lifecycle",

  "worker_assignment_engine",

  "media_factory_core",

  "executive_reporting_runtime",

  "worker_performance_review",

  "worker_recovery_system",

] as const;



export const ECW_CAPABILITIES = [

  "manage_editorial_direction",

  "define_channel_identity",

  "define_target_audience",

  "define_editorial_tone",

  "define_content_standards",

  "define_publishing_priorities",

  "review_content_quality",

  "ensure_brand_consistency",

  "maintain_long_term_content_strategy",

  "approve_editorial_decisions",

  "produce_machine_readable_editorial_reports",

  "preserve_editorial_consistency",

  "preserve_channel_identity",

  "preserve_audience_alignment",

  "preserve_audit_history",

  "submit_reports_through_executive_reporting_runtime",

  "never_bypass_pillow_governance",

  "integrate_worker_registry",

  "integrate_worker_lifecycle",

  "integrate_worker_assignment_engine",

  "integrate_media_factory_core",

  "integrate_worker_performance_review",

  "integrate_worker_recovery_system",

  "editor_in_chief_worker_validation",

  "health_monitoring",

  "recovery_management",

] as const;


