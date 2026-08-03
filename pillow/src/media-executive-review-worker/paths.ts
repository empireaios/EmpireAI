/** PILLOW-MER-001 — Media Executive Review Worker (Q4-18). */
export const MEDIA_EXECUTIVE_REVIEW_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MEDIA_EXECUTIVE_REVIEW_WORKER_SYSTEM.md" as const;
export const MEDIA_EXECUTIVE_REVIEW_WORKER_ID = "media-executive-review-worker" as const;
export const MER_METADATA_VERSION = "MER-001-v1" as const;
export const MER_REPORT_VERSION = "MER-RPT-v1" as const;

export const MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY = {
  workerId: "wkr-media-executive-review-01",
  workerName: "Media Executive Review Worker",
  workerType: "analyst",
  department: "media",
  factory: "media-factory",
  role: "role-analyst-media-executive-review",
  reportingLine: ["wkr-media-executive-review-01", "pillow"] as string[],
  skillProfile: [
    "skill-media-executive-review",
    "skill-editorial-compliance-verification",
    "skill-script-quality-verification",
    "skill-thumbnail-quality-verification",
    "skill-visual-asset-readiness",
    "skill-voice-subtitle-readiness",
    "skill-publishing-package-completeness",
    "skill-analytics-learning-traceability",
    "skill-executive-approve-revise-reject",
  ],
  approvedTools: [
    "media_executive_review_ledger",
    "review_traceability_registry",
    "structured_reporting",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "verifying",
  "reviewing",
  "recommending",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const EXECUTIVE_RECOMMENDATIONS = ["Approve", "Revise", "Reject"] as const;

export const FINDING_KINDS = ["verified", "recommendation"] as const;

export const FINDING_CATEGORIES = [
  "editorial",
  "script",
  "thumbnail",
  "visual",
  "voice",
  "subtitle",
  "publishing",
  "analytics",
  "learning",
  "compliance",
  "prerequisite",
] as const;

export const FINDING_SEVERITIES = ["info", "warning", "blocker"] as const;

export const EDITORIAL_STATUSES = ["compliant", "partial", "non_compliant"] as const;

export const EXPECTED_PREREQUISITE_WORKER_KEYS = [
  "publishing_worker",
  "media_analytics_worker",
  "media_learning_worker",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "publishing_worker",
  "media_analytics_worker",
  "media_learning_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const MER_CAPABILITIES = [
  "receive_all_completed_media_factory_outputs",
  "verify_editorial_compliance",
  "verify_script_quality",
  "verify_thumbnail_quality",
  "verify_visual_asset_readiness",
  "verify_voice_and_subtitle_readiness",
  "verify_publishing_package_completeness",
  "verify_analytics_and_learning_traceability",
  "identify_outstanding_issues",
  "recommend_approve_revise_or_reject",
  "produce_machine_readable_media_executive_review_reports",
  "verify_all_prerequisite_workers_completed_successfully",
  "preserve_complete_traceability",
  "never_modify_approved_assets",
  "distinguish_verified_findings_from_recommendations",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_bypass_pillow_governance",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_publishing_worker",
  "integrate_media_analytics_worker",
  "integrate_media_learning_worker",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "media_executive_review_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
