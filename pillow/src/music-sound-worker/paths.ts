/** PILLOW-MSW-001 — Music & Sound Worker (Q4-13). */
export const MUSIC_SOUND_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MUSIC_SOUND_WORKER_SYSTEM.md" as const;
export const MUSIC_SOUND_WORKER_ID = "music-sound-worker" as const;
export const MSW_METADATA_VERSION = "MSW-001-v1" as const;
export const MSW_REPORT_VERSION = "MSW-RPT-v1" as const;

export const MUSIC_SOUND_WORKER_IDENTITY = {
  workerId: "wkr-music-sound-01",
  workerName: "Music & Sound Worker",
  workerType: "creator",
  department: "media",
  factory: "media-factory",
  role: "role-creator-music-sound",
  reportingLine: ["wkr-music-sound-01", "pillow"] as string[],
  skillProfile: [
    "skill-music-mood-analysis",
    "skill-sound-effect-selection",
    "skill-licensed-music-selection",
    "skill-generated-music-selection",
    "skill-scene-audio-matching",
    "skill-licensing-compliance",
    "skill-audio-timeline-placement",
  ],
  approvedTools: ["audio_asset_ledger", "music_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "analyzing",
  "selecting",
  "matching",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const AUDIO_ASSET_TYPES = [
  "background_music",
  "intro_music",
  "outro_music",
  "ambient_audio",
  "transition_effects",
  "notification_sounds",
  "cinematic_effects",
  "generated_music",
] as const;

export const MUSIC_MOODS = [
  "neutral",
  "uplifting",
  "tense",
  "calm",
  "energetic",
  "cinematic",
  "curious",
  "inspirational",
] as const;

export const LICENSING_STATUSES = [
  "licensed",
  "royalty_free_licensed",
  "internally_generated",
  "platform_approved",
  "restricted",
  "unapproved",
] as const;

export const QUALITY_STATUSES = ["pass", "pass_with_notes", "fail", "pending_review"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "script_worker",
  "video_assembly_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const MSW_CAPABILITIES = [
  "receive_approved_scripts",
  "receive_approved_video_timeline",
  "determine_required_music_mood",
  "determine_required_sound_effects",
  "select_licensed_music",
  "select_generated_music_where_approved",
  "match_music_to_scenes",
  "match_sound_effects_to_events",
  "validate_licensing_compliance",
  "produce_machine_readable_music_sound_reports",
  "preserve_complete_asset_traceability",
  "preserve_licensing_information",
  "preserve_timeline_synchronization",
  "validate_copyright_compliance",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_use_unapproved_copyrighted_assets",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_script_worker",
  "integrate_video_assembly_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "music_sound_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
