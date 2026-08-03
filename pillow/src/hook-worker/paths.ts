/** PILLOW-HKW-001 — Hook Worker (Q4-06). */
export const HOOK_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_HOOK_WORKER_SYSTEM.md" as const;
export const HOOK_WORKER_ID = "hook-worker" as const;
export const HKW_METADATA_VERSION = "HKW-001-v1" as const;
export const HKW_REPORT_VERSION = "HKW-RPT-v1" as const;

export const HOOK_WORKER_IDENTITY = {
  workerId: "wkr-hook-01",
  workerName: "Hook Worker",
  workerType: "optimizer",
  department: "media",
  factory: "media-factory",
  role: "role-creator-hook-worker",
  reportingLine: ["wkr-hook-01", "pillow"] as string[],
  skillProfile: [
    "skill-opening-hook-generation",
    "skill-curiosity-gap-design",
    "skill-retention-loop-optimization",
    "skill-pacing-recommendations",
    "skill-audience-engagement",
    "skill-self-review",
  ],
  approvedTools: ["hook_ledger", "hook_registry", "structured_reporting"],
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

export const HOOK_TYPES = [
  "question_hook",
  "curiosity_hook",
  "shock_hook",
  "story_hook",
  "fact_hook",
  "problem_hook",
  "benefit_hook",
  "countdown_hook",
  "emotional_hook",
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

export const HKW_CAPABILITIES = [
  "receive_approved_scripts",
  "generate_opening_hooks",
  "generate_curiosity_gaps",
  "generate_retention_loops",
  "generate_continuation_moments",
  "improve_pacing_recommendations",
  "improve_audience_engagement",
  "generate_multiple_hook_alternatives",
  "self_review_hook_effectiveness",
  "produce_machine_readable_hook_reports",
  "preserve_approved_script_intent",
  "avoid_misleading_or_deceptive_hooks",
  "generate_original_hooks",
  "preserve_complete_traceability",
  "perform_self_review_before_submission",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_script_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "hook_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
