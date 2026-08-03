/** PILLOW-MFC-001 — Media Factory Core (Q4-01). */
export const MEDIA_FACTORY_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MEDIA_FACTORY_CORE_SYSTEM.md" as const;
export const MEDIA_FACTORY_CORE_ID = "media-factory-core" as const;
export const MFC_METADATA_VERSION = "MFC-001-v1" as const;
export const MEDIA_FACTORY_REPORT_VERSION = "MFC-MFR-v1" as const;
export const MEDIA_BUSINESS_MISSION_VERSION = "MFC-MBM-v1" as const;

export const MEDIA_FACTORY_CORE_IDENTITY = {
  workerId: "wkr-media-factory-core-01",
  workerName: "Media Factory Core",
  workerType: "coordinator",
  department: "media",
  factory: "media-factory",
  role: "role-coordinator-media-factory-core",
  reportingLine: ["wkr-media-factory-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-creation",
    "skill-channel-registration",
    "skill-pipeline-coordination",
    "skill-approval-workflow",
    "skill-publishing-coordination",
    "skill-traceability",
  ],
  approvedTools: ["mission_composer", "channel_registry", "pipeline_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "coordinating",
  "validating",
  "creating",
  "registering",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const CHANNEL_TYPES = [
  "youtube",
  "tiktok",
  "instagram",
  "podcast",
  "newsletter",
  "blog",
  "linkedin",
  "x_twitter",
  "multi_channel",
  "unknown",
] as const;

export const PIPELINE_TYPES = [
  "short_form_video",
  "long_form_video",
  "podcast_episode",
  "newsletter_issue",
  "social_post",
  "blog_article",
  "multi_format",
] as const;

export const CONTENT_STAGES = [
  "mission_created",
  "channel_registered",
  "pipeline_registered",
  "production",
  "approval",
  "publishing",
  "analytics",
  "learning",
  "completed",
] as const;

export const MISSION_STATUSES = [
  "drafted",
  "active",
  "coordinating",
  "awaiting_approval",
  "publishing",
  "learning",
  "completed",
  "rejected",
] as const;

export const APPROVAL_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "rejected",
  "blocked_bypass_attempt",
] as const;

export const PUBLISHING_STATUSES = [
  "not_ready",
  "queued",
  "coordinating",
  "published_signal",
  "blocked_pending_approval",
  "failed",
] as const;

export const LEARNING_STATUSES = [
  "idle",
  "collecting",
  "analyzing",
  "applied",
  "deferred",
] as const;

export const PRODUCTION_STATUSES = [
  "not_started",
  "coordinating",
  "in_production",
  "awaiting_approval",
  "ready_to_publish",
  "completed",
  "blocked",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "mission_coordination_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
  "health_monitoring",
  "recovery_management",
  "media_factory_core_validation",
] as const;

export const MFC_CAPABILITIES = [
  "create_media_business_missions",
  "register_media_channels",
  "register_content_pipelines",
  "manage_content_lifecycle",
  "coordinate_downstream_media_workers",
  "coordinate_approval_workflows",
  "coordinate_publishing_workflows",
  "coordinate_analytics_collection",
  "coordinate_continuous_learning",
  "track_production_status",
  "track_publishing_status",
  "produce_machine_readable_media_factory_reports",
  "preserve_mission_traceability",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_mission_coordination_engine",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "integrate_health_monitoring",
  "integrate_recovery_management",
  "media_factory_core_validation",
  "health_monitoring",
  "recovery_management",
] as const;
