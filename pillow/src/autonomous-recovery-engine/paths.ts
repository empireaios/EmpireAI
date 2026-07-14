/** Canonical Autonomous Recovery Engine (P6-06). */
export const AUTONOMOUS_RECOVERY_ENGINE_PATH =
  "docs/governance/EMPIREAI_AUTONOMOUS_RECOVERY_ENGINE.md";

/** Recovery Doctrine companion (P4-05). */
export const RECOVERY_DOCTRINE_COMPANION_PATH =
  "docs/governance/EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md";

/** ETA Engine companion (P6-05). */
export const ETA_ENGINE_COMPANION_PATH = "docs/governance/EMPIREAI_ETA_ENGINE.md";

/** Re-export constitutional limits from P4-05. */
export { RECOVERY_LIMITS } from "../recovery-doctrine/paths.js";

/** Autonomous Recovery Engine principles (P6-06). */
export const AUTONOMOUS_RECOVERY_PRINCIPLES = [
  "Recovery Doctrine defines WHAT — Autonomous Recovery Engine defines HOW",
  "Single recovery orchestration authority — no competing recovery systems",
  "Autonomous recovery when constitutional · repository · production integrity preserved",
  "Escalate only when irreversible action or Grand King approval required",
  "Continuous detection from Builder Monitor · Supervisor · ETA evidence",
  "Full recovery journey recorded for Vision Accumulation",
  "Supervisor → Pillow → ECC → Grand King escalation order preserved",
  "Recovery confidence threshold enforced before autonomous execution",
] as const;

/** Autonomous Recovery responsibilities (P6-06). */
export const AUTONOMOUS_RECOVERY_RESPONSIBILITIES = [
  "continuous_failure_detection",
  "evidence_collection",
  "failure_classification",
  "root_cause_analysis",
  "recovery_strategy_selection",
  "safety_validation",
  "recovery_execution",
  "recovery_verification",
  "journey_recording",
  "escalation_coordination",
] as const;

/** Failure signals the engine detects (P6-06). */
export const RECOVERY_DETECTION_SIGNALS = [
  "mission_stall",
  "heartbeat_loss",
  "execution_timeout",
  "dependency_failure",
  "repository_failure",
  "validation_failure",
  "worker_failure",
  "queue_failure",
  "runtime_failure",
  "infrastructure_failure",
  "production_failure",
  "unknown_failure",
] as const;

/** Recovery orchestration pipeline (P6-06). */
export const RECOVERY_ORCHESTRATION_PIPELINE = [
  "failure_detected",
  "evidence_collection",
  "failure_classification",
  "root_cause_analysis",
  "recovery_strategy_selection",
  "safety_validation",
  "recovery_execution",
  "recovery_verification",
  "journey_recording",
  "vision_accumulation",
] as const;

/** Recovery strategy IDs (P6-06). */
export const RECOVERY_STRATEGY_IDS = [
  "retry",
  "resume",
  "restart_worker",
  "restart_queue",
  "reload_context",
  "rebuild_execution_state",
  "restore_session",
  "rollback_safe_changes",
  "continue_mission",
  "pause_mission",
  "escalate",
] as const;

/** Escalation levels (P6-06 — aligned with P4-05). */
export const RECOVERY_ESCALATION_LEVELS = [
  "supervisor",
  "pillow",
  "ecc",
  "grand_king",
] as const;

/** Autonomous recovery limits (P6-06). */
export const AUTONOMOUS_RECOVERY_LIMITS = {
  maxRetryAttempts: 3,
  recoveryTimeoutMs: 300_000,
  recoveryConfidenceThreshold: 0.65,
  safeRollbackPolicy: "rollback_requires_grand_king",
  safeStopPolicy: "stop_on_irreversible",
  manualApprovalThreshold: 0.45,
} as const;
