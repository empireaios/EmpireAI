/** PILLOW-PBW-001 — Publishing Worker (Q4-14). */
export const PUBLISHING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PUBLISHING_WORKER_SYSTEM.md" as const;
export const PUBLISHING_WORKER_ID = "publishing-worker" as const;
export const PBW_METADATA_VERSION = "PBW-001-v1" as const;
export const PBW_REPORT_VERSION = "PBW-RPT-v1" as const;

export const PUBLISHING_WORKER_IDENTITY = {
  workerId: "wkr-publishing-01",
  workerName: "Publishing Worker",
  workerType: "creator",
  department: "media",
  factory: "media-factory",
  role: "role-creator-publishing",
  reportingLine: ["wkr-publishing-01", "pillow"] as string[],
  skillProfile: [
    "skill-platform-title-optimization",
    "skill-platform-description-writing",
    "skill-tag-keyword-generation",
    "skill-thumbnail-selection",
    "skill-playlist-generation",
    "skill-publishing-schedule",
    "skill-upload-package-preparation",
  ],
  approvedTools: ["publishing_asset_ledger", "platform_package_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "generating",
  "selecting",
  "scheduling",
  "packaging",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const PUBLISHING_PLATFORMS = [
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "x",
  "linkedin",
] as const;

export const READINESS_STATUSES = [
  "ready",
  "pending_approval",
  "not_ready",
  "blocked",
] as const;

export const APPROVAL_STATUSES = [
  "approved",
  "pending",
  "rejected",
  "not_requested",
] as const;

export const QUALITY_STATUSES = ["pass", "pass_with_notes", "fail", "pending_review"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "video_assembly_worker",
  "thumbnail_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const PBW_CAPABILITIES = [
  "receive_completed_media_assets",
  "generate_optimized_video_titles",
  "generate_platform_descriptions",
  "generate_tags_and_keywords",
  "select_approved_thumbnails",
  "generate_playlists",
  "generate_publishing_schedules",
  "prepare_platform_specific_upload_packages",
  "validate_publishing_readiness",
  "produce_machine_readable_publishing_reports",
  "preserve_complete_asset_traceability",
  "preserve_publishing_metadata_history",
  "validate_platform_requirements",
  "validate_approval_status_before_publication",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_automatically_publish_content",
  "never_bypass_pillow_or_grand_king_approval",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_video_assembly_worker",
  "integrate_thumbnail_worker",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "publishing_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
