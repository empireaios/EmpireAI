/** PILLOW-STW-001 — Subtitle Worker (Q4-12). */
export const SUBTITLE_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUBTITLE_WORKER_SYSTEM.md" as const;
export const SUBTITLE_WORKER_ID = "subtitle-worker" as const;
export const STW_METADATA_VERSION = "STW-001-v1" as const;
export const STW_REPORT_VERSION = "STW-RPT-v1" as const;

export const SUBTITLE_WORKER_IDENTITY = {
  workerId: "wkr-subtitle-01",
  workerName: "Subtitle Worker",
  workerType: "creator",
  department: "media",
  factory: "media-factory",
  role: "role-creator-subtitle",
  reportingLine: ["wkr-subtitle-01", "pillow"] as string[],
  skillProfile: [
    "skill-transcript-generation",
    "skill-caption-synchronization",
    "skill-subtitle-timing",
    "skill-multilingual-subtitles",
    "skill-timing-accuracy-validation",
    "skill-sync-issue-detection",
    "skill-subtitle-export",
  ],
  approvedTools: ["subtitle_asset_ledger", "caption_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "transcribing",
  "timing",
  "validating",
  "exporting",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const SUBTITLE_LANGUAGES = [
  "en-US",
  "en-GB",
  "es-ES",
  "fr-FR",
  "de-DE",
  "pt-BR",
  "ja-JP",
  "zh-CN",
] as const;

export const EXPORT_FORMATS = ["srt", "vtt", "txt_transcript", "caption_timeline"] as const;

export const QUALITY_STATUSES = ["pass", "pass_with_notes", "fail", "pending_review"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "script_worker",
  "voice_worker",
  "video_assembly_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const STW_CAPABILITIES = [
  "receive_approved_scripts",
  "receive_approved_voice_assets",
  "generate_complete_transcripts",
  "generate_synchronized_captions",
  "generate_subtitle_timing",
  "support_multiple_subtitle_languages",
  "validate_subtitle_timing_accuracy",
  "detect_synchronization_issues",
  "produce_exportable_subtitle_files",
  "produce_machine_readable_subtitle_reports",
  "preserve_script_traceability",
  "preserve_subtitle_synchronization",
  "preserve_transcript_history",
  "validate_subtitle_quality",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_modify_approved_scripts",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_script_worker",
  "integrate_voice_worker",
  "integrate_video_assembly_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "subtitle_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
