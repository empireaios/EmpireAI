/** Canonical Recovery Doctrine system document (P4-05). */

export const RECOVERY_DOCTRINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md";

/** Companion execution doctrine — not duplicated. */
export const CURSOR_RECOVERY_COMPANION_PATH =
  "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md";

/** Recovery limits — constitutional policy (P4-05 §Recovery Limits). */
export const RECOVERY_LIMITS = {
  maxRetryAttempts: 3,
  recoveryTimeoutMs: 300_000,
  recoveryConfidenceThreshold: 0.65,
  humanInterventionThreshold: 0.45,
  safeStopOnIrreversible: true,
  rollbackRequiresGrandKing: true,
} as const;

export const RECOVERY_PIPELINE_STEPS = [
  "failure_detected",
  "failure_classification",
  "evidence_collection",
  "root_cause_analysis",
  "recovery_strategy_selection",
  "recovery_validation",
  "recovery_execution",
  "verification",
  "lessons_learned",
  "vision_accumulation",
] as const;

export const FAILURE_CLASSIFICATIONS = [
  "transient",
  "configuration",
  "infrastructure",
  "repository",
  "architecture",
  "engineering",
  "production",
  "dependency",
  "external_service",
  "human_approval_required",
  "unknown",
] as const;

export const ESCALATION_LEVELS = [
  "supervisor",
  "pillow",
  "chief_architect",
  "grand_king",
] as const;

export const AUTONOMOUS_RECOVERY_ACTIONS = [
  "retry",
  "resume",
  "reload_context",
  "restart_worker",
  "restart_queue",
  "rebuild_cache",
  "reconnect_provider",
  "revalidate_dependencies",
  "continue_mission",
  "resume_journey",
] as const;
