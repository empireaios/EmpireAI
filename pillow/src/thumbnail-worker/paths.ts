/** PILLOW-THW-001 — Thumbnail Worker (Q4-07). */
export const THUMBNAIL_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_THUMBNAIL_WORKER_SYSTEM.md" as const;
export const THUMBNAIL_WORKER_ID = "thumbnail-worker" as const;
export const THW_METADATA_VERSION = "THW-001-v1" as const;
export const THW_REPORT_VERSION = "THW-RPT-v1" as const;

export const THUMBNAIL_WORKER_IDENTITY = {
  workerId: "wkr-thumbnail-01",
  workerName: "Thumbnail Worker",
  workerType: "creator",
  department: "media",
  factory: "media-factory",
  role: "role-creator-thumbnail-worker",
  reportingLine: ["wkr-thumbnail-01", "pillow"] as string[],
  skillProfile: [
    "skill-thumbnail-concept-design",
    "skill-emotional-trigger-mapping",
    "skill-text-overlay-optimization",
    "skill-composition-framing",
    "skill-ab-variant-generation",
    "skill-self-review",
  ],
  approvedTools: ["thumbnail_ledger", "thumbnail_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "generating",
  "reviewing",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const CONTENT_FORMATS = [
  "long_form_video",
  "short",
  "reel",
  "documentary",
  "explainer",
  "educational",
  "news",
  "list_video",
  "social_content",
] as const;

export const DESIGN_ELEMENTS = [
  "subject_focus",
  "composition",
  "text_overlay",
  "emotional_trigger",
  "contrast",
  "colour_guidance",
  "visual_hierarchy",
  "curiosity_element",
  "branding_consistency",
] as const;

export const EMOTIONAL_TRIGGERS = [
  "curiosity",
  "urgency",
  "empathy",
  "triumph",
  "tension",
  "surprise",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "script_worker",
  "hook_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const THW_CAPABILITIES = [
  "receive_approved_scripts",
  "receive_approved_hooks",
  "generate_thumbnail_concepts",
  "generate_emotional_triggers",
  "generate_text_overlay_suggestions",
  "recommend_composition_and_framing",
  "generate_multiple_ab_thumbnail_variants",
  "validate_consistency_with_script_content",
  "self_review_thumbnail_quality",
  "produce_machine_readable_thumbnail_reports",
  "follow_editor_in_chief_strategy",
  "remain_consistent_with_approved_script",
  "avoid_misleading_or_deceptive_thumbnails",
  "produce_multiple_design_alternatives",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_script_worker",
  "integrate_hook_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "thumbnail_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
