/** PILLOW-MDC-001 — Media Certification (Q4-19). */
export const MEDIA_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MEDIA_CERTIFICATION_SYSTEM.md" as const;
export const MEDIA_CERTIFICATION_ID = "media-certification" as const;
export const MDC_METADATA_VERSION = "MDC-001-v1" as const;
export const MEDIA_FACTORY_VERSION = "Q4-MFC-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "certifying",
  "assessing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Final certification levels (Q4-19).
 * Architecture allows additional levels via configuration without redesign.
 */
export const CERTIFICATION_LEVELS = [
  "certified",
  "certified_with_warnings",
  "provisionally_certified",
  "failed_certification",
] as const;

/**
 * Mandatory Media Factory components (Q4-01 … Q4-18).
 */
export const MEDIA_FACTORY_COMPONENTS = [
  {
    id: "media-factory-core",
    label: "Media Factory Core",
    missionId: "Q4-01",
  },
  {
    id: "editor-in-chief-worker",
    label: "Editor-in-Chief Worker",
    missionId: "Q4-02",
  },
  {
    id: "trend-research-worker",
    label: "Trend Research Worker",
    missionId: "Q4-03",
  },
  {
    id: "topic-planner-worker",
    label: "Topic Planner Worker",
    missionId: "Q4-04",
  },
  {
    id: "script-worker",
    label: "Script Worker",
    missionId: "Q4-05",
  },
  {
    id: "hook-worker",
    label: "Hook Worker",
    missionId: "Q4-06",
  },
  {
    id: "thumbnail-worker",
    label: "Thumbnail Worker",
    missionId: "Q4-07",
  },
  {
    id: "visual-research-worker",
    label: "Visual Research Worker",
    missionId: "Q4-08",
  },
  {
    id: "image-creative-worker",
    label: "Image & Creative Worker",
    missionId: "Q4-09",
  },
  {
    id: "voice-worker",
    label: "Voice Worker",
    missionId: "Q4-10",
  },
  {
    id: "video-assembly-worker",
    label: "Video Assembly Worker",
    missionId: "Q4-11",
  },
  {
    id: "subtitle-worker",
    label: "Subtitle Worker",
    missionId: "Q4-12",
  },
  {
    id: "music-sound-worker",
    label: "Music & Sound Worker",
    missionId: "Q4-13",
  },
  {
    id: "publishing-worker",
    label: "Publishing Worker",
    missionId: "Q4-14",
  },
  {
    id: "media-analytics-worker",
    label: "Media Analytics Worker",
    missionId: "Q4-15",
  },
  {
    id: "media-learning-worker",
    label: "Media Learning Worker",
    missionId: "Q4-16",
  },
  {
    id: "channel-recommendation-worker",
    label: "Channel Recommendation Worker",
    missionId: "Q4-17",
  },
  {
    id: "media-executive-review-worker",
    label: "Media Executive Review Worker",
    missionId: "Q4-18",
  },
] as const;

/**
 * Final acceptance integration domains (Q4-19).
 */
export const INTEGRATION_DOMAINS = [
  "editorial_to_trends",
  "trends_to_topics",
  "topics_to_scripts",
  "scripts_to_hooks",
  "hooks_to_thumbnails",
  "scripts_to_visual_research",
  "visual_research_to_image_creative",
  "scripts_to_voice",
  "voice_to_video_assembly",
  "video_assembly_to_subtitles",
  "video_assembly_to_music_sound",
  "assembly_to_publishing",
  "publishing_to_analytics",
  "analytics_to_learning",
  "learning_to_channel_recommendation",
  "package_to_executive_review",
  "cross_worker_integration",
  "executive_reporting",
  "traceability_chain",
  "pillow_governance",
  "autonomous_operation_under_pillow",
  "media_operational_readiness",
] as const;

/**
 * Mandatory Media Factory governance / operational validations (Q4-19).
 */
export const MEDIA_GOVERNANCE_RULES = [
  "editorial_strategy_operates_correctly",
  "trend_discovery_functions_correctly",
  "topic_planning_functions_correctly",
  "script_generation_functions_correctly",
  "hooks_improve_engagement",
  "thumbnail_concepts_generated",
  "visual_research_completed",
  "creative_assets_generated",
  "voice_generation_completed",
  "video_assembly_completed",
  "subtitles_generated",
  "music_and_sound_integrated",
  "publishing_packages_generated",
  "analytics_collected",
  "learning_generated",
  "channel_recommendations_generated",
  "executive_review_completed",
  "full_traceability_preserved",
  "entire_media_factory_operates_under_pillow_governance",
] as const;

export const COMPONENT_PROBE_RESULTS = ["pass", "warning", "fail"] as const;

export const MDC_CAPABILITIES = [
  "verify_media_factory_core",
  "verify_editor_in_chief_worker",
  "verify_trend_research_worker",
  "verify_topic_planner_worker",
  "verify_script_worker",
  "verify_hook_worker",
  "verify_thumbnail_worker",
  "verify_visual_research_worker",
  "verify_image_creative_worker",
  "verify_voice_worker",
  "verify_video_assembly_worker",
  "verify_subtitle_worker",
  "verify_music_sound_worker",
  "verify_publishing_worker",
  "verify_media_analytics_worker",
  "verify_media_learning_worker",
  "verify_channel_recommendation_worker",
  "verify_media_executive_review_worker",
  "verify_cross_worker_integration",
  "verify_autonomous_operation_under_pillow",
  "produce_unified_media_certification_report",
  "assess_media_workflow_completeness",
  "determine_q4_production_readiness",
  "confirm_readiness_for_q5",
  "extensible_certification_levels",
  "extensible_integration_domains",
  "preserve_auditability",
  "preserve_traceability",
  "media_certification_validation",
  "health_monitoring",
  "recovery_management",
] as const;
