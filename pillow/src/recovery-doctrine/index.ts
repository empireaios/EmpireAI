export { RecoveryDoctrineEngine, createRecoveryDoctrineEngine } from "./engine.js";
export { executeRecoveryPipeline } from "./pipeline.js";
export {
  buildRecoveryReadinessPipeline,
  evaluateRecoveryBuilderGate,
} from "./builder-gate.js";
export { classifyFailure } from "./failure-classifier.js";
export { selectEscalationLevel } from "./escalation.js";
export {
  selectAutonomousActions,
  computeRecoveryConfidence,
} from "./autonomous-actions.js";
export { formatRecoveryPreamble, prependRecoveryDoctrine } from "./mission-preamble.js";
export {
  RECOVERY_DOCTRINE_SYSTEM_PATH,
  CURSOR_RECOVERY_COMPANION_PATH,
  RECOVERY_LIMITS,
  RECOVERY_PIPELINE_STEPS,
  FAILURE_CLASSIFICATIONS,
  ESCALATION_LEVELS,
  AUTONOMOUS_RECOVERY_ACTIONS,
} from "./paths.js";
export type {
  FailureClassification,
  EscalationLevel,
  AutonomousRecoveryAction,
  RecoveryPipelineStepId,
  RecoveryDoctrineState,
  RecoveryDoctrineRequest,
  RecoveryBuilderGateResult,
  RecoveryReadinessPipeline,
  RecoveryPipelineResult,
  RecoveryOutcomeReport,
  RecoveryMetrics,
  RecoveryEffectivenessReview,
  RecoveryMissionFailureRequest,
} from "./types.js";
