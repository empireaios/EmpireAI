/** PILLOW-SCW-001 — Script Worker (Q4-05). */
export const SCRIPT_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SCRIPT_WORKER_SYSTEM.md" as const;
export const SCRIPT_WORKER_ID = "script-worker" as const;
export const SCW_METADATA_VERSION = "SCW-001-v1" as const;
export const SCW_REPORT_VERSION = "SCW-RPT-v1" as const;

export const SCRIPT_WORKER_IDENTITY = {
  workerId: "wkr-script-01",
  workerName: "Script Worker",
  workerType: "creator",
  department: "media",
  factory: "media-factory",
  role: "role-creator-script-worker",
  reportingLine: ["wkr-script-01", "pillow"] as string[],
  skillProfile: [
    "skill-editorial-strategy-alignment",
    "skill-topic-plan-integration",
    "skill-script-structure",
    "skill-narration-ready-writing",
    "skill-channel-identity-adaptation",
    "skill-self-review",
  ],
  approvedTools: ["script_ledger", "script_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "formatting",
  "writing",
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

export const SECTION_TYPES = [
  "intro",
  "body",
  "conclusion",
  "hook",
  "cta",
  "transition",
  "list_item",
] as const;

export const EDITORIAL_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "editor_in_chief_worker",
  "topic_planner_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const SCW_CAPABILITIES = [
  "receive_approved_topic_plans",
  "receive_editorial_strategy",
  "determine_content_format",
  "generate_complete_scripts",
  "adapt_writing_style_to_channel_identity",
  "structure_introductions_body_and_conclusions",
  "generate_narration_ready_output",
  "support_multiple_content_formats",
  "self_review_generated_scripts",
  "produce_machine_readable_script_reports",
  "follow_approved_topic_plan",
  "follow_editor_in_chief_strategy",
  "produce_original_content",
  "preserve_script_traceability",
  "perform_self_review_before_submission",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_editor_in_chief_worker",
  "integrate_topic_planner_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "script_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
