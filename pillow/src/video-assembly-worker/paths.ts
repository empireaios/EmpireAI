/** PILLOW-VAW-001 — Video Assembly Worker (Q4-11). */
export const VIDEO_ASSEMBLY_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VIDEO_ASSEMBLY_WORKER_SYSTEM.md" as const;
export const VIDEO_ASSEMBLY_WORKER_ID = "video-assembly-worker" as const;
export const VAW_METADATA_VERSION = "VAW-001-v1" as const;
export const VAW_REPORT_VERSION = "VAW-RPT-v1" as const;

export const VIDEO_ASSEMBLY_WORKER_IDENTITY = {
  workerId: "wkr-video-assembly-01",
  workerName: "Video Assembly Worker",
  workerType: "creator",
  department: "media",
  factory: "media-factory",
  role: "role-creator-video-assembly",
  reportingLine: ["wkr-video-assembly-01", "pillow"] as string[],
  skillProfile: [
    "skill-media-asset-ingestion",
    "skill-timeline-assembly",
    "skill-narration-visual-sync",
    "skill-scene-transitions",
    "skill-motion-effects",
    "skill-multi-resolution-render",
    "skill-render-quality-validation",
  ],
  approvedTools: ["assembly_timeline_ledger", "render_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "synchronizing",
  "assembling",
  "rendering",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const OUTPUT_ASPECTS = ["landscape", "vertical", "square"] as const;
export const OUTPUT_RESOLUTIONS = ["hd", "full_hd", "4k"] as const;
export const TRANSITION_TYPES = [
  "cut",
  "crossfade",
  "dissolve",
  "slide_left",
  "slide_right",
  "fade_to_black",
] as const;
export const MOTION_EFFECTS = [
  "none",
  "ken_burns",
  "pan_left",
  "pan_right",
  "zoom_in",
  "zoom_out",
  "parallax",
] as const;
export const QUALITY_STATUSES = ["pass", "pass_with_notes", "fail", "pending_review"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "script_worker",
  "voice_worker",
  "image_creative_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const VAW_CAPABILITIES = [
  "receive_approved_scripts",
  "receive_approved_voice_assets",
  "receive_approved_visual_assets",
  "receive_approved_creative_assets",
  "receive_approved_music_assets",
  "synchronize_narration_and_visuals",
  "apply_scene_transitions",
  "apply_motion_effects",
  "produce_multiple_output_resolutions",
  "validate_rendering_quality",
  "produce_machine_readable_video_assembly_reports",
  "preserve_complete_asset_traceability",
  "preserve_synchronization_between_media_assets",
  "validate_rendering_quality_rule",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_publish_videos_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_script_worker",
  "integrate_voice_worker",
  "integrate_image_creative_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "video_assembly_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
