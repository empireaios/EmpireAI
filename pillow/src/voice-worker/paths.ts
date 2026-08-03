/** PILLOW-VOW-001 — Voice Worker (Q4-10). */
export const VOICE_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VOICE_WORKER_SYSTEM.md" as const;
export const VOICE_WORKER_ID = "voice-worker" as const;
export const VOW_METADATA_VERSION = "VOW-001-v1" as const;
export const VOW_REPORT_VERSION = "VOW-RPT-v1" as const;

export const VOICE_WORKER_IDENTITY = {
  workerId: "wkr-voice-01",
  workerName: "Voice Worker",
  workerType: "creator",
  department: "media",
  factory: "media-factory",
  role: "role-creator-voice",
  reportingLine: ["wkr-voice-01", "pillow"] as string[],
  skillProfile: [
    "skill-narration-segmentation",
    "skill-voice-profile-configuration",
    "skill-multilingual-voice",
    "skill-pacing-pronunciation-control",
    "skill-voiceover-generation",
    "skill-voice-quality-validation",
    "skill-alternate-voice-variants",
  ],
  approvedTools: ["voice_asset_ledger", "voice_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "preparing",
  "configuring",
  "generating",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VOICE_PROFILES = [
  "narrator_neutral",
  "narrator_warm",
  "presenter_authoritative",
  "storyteller_expressive",
  "educator_clear",
  "host_energetic",
] as const;

export const VOICE_LANGUAGES = [
  "en-US",
  "en-GB",
  "es-ES",
  "fr-FR",
  "de-DE",
  "pt-BR",
  "ja-JP",
  "zh-CN",
] as const;

export const VOICE_TONES = [
  "neutral",
  "warm",
  "authoritative",
  "conversational",
  "dramatic",
] as const;

export const EMOTIONAL_STYLES = [
  "calm",
  "curious",
  "urgent",
  "inspirational",
  "empathetic",
] as const;

export const QUALITY_STATUSES = ["pass", "pass_with_notes", "fail", "pending_review"] as const;

export const VOICE_CAPABILITIES_CATALOG = [
  "multiple_voices",
  "multiple_languages",
  "adjustable_speaking_speed",
  "pronunciation_control",
  "tone_selection",
  "emotional_style",
  "pause_control",
  "exportable_audio_assets",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "script_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const VOW_CAPABILITIES = [
  "receive_approved_scripts",
  "prepare_narration_segments",
  "configure_voice_generation_settings",
  "support_multiple_voice_profiles",
  "support_multiple_languages",
  "control_pacing_and_pronunciation",
  "generate_voiceover_assets",
  "validate_voice_quality",
  "generate_alternate_voice_versions",
  "produce_machine_readable_voice_reports",
  "preserve_script_traceability",
  "preserve_generated_voice_asset_references",
  "preserve_voice_configuration_history",
  "validate_output_quality",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_publish_media_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_script_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "voice_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
