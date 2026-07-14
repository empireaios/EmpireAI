export {
  ZeroHumanAutomationEngine,
  createZeroHumanAutomationEngine,
  type ZeroHumanAutomationSurfaces,
} from "./engine.js";
export {
  buildZeroHumanAutomationReadinessPipeline,
  buildZeroHumanAutomationReadinessPipelineSync,
  evaluateZeroHumanAutomationGate,
} from "./builder-gate.js";
export {
  assessAutomationState,
  evaluateAutomationSafety,
  formatAutomationLevel,
} from "./automation-orchestrator.js";
export {
  analyzeAutomationQuality,
  buildPhaseP6CompletionReview,
} from "./automation-assessment.js";
export { formatZeroHumanAutomationPreamble, prependZeroHumanAutomation } from "./mission-preamble.js";
export { AUTOMATION_PIPELINE_REGISTRY } from "./pipeline-registry.js";
export { SUBSYSTEM_AUTOMATION_LEVELS, aggregateAutomationLevel } from "./automation-levels-registry.js";
export { AUTOMATION_EVENT_REGISTRY } from "./event-registry.js";
export {
  ZERO_HUMAN_AUTOMATION_PATH,
  AUTOMATION_PRINCIPLES,
  AUTOMATION_DOMAINS,
  AUTOMATION_PIPELINE_STAGES,
  AUTOMATION_LEVELS,
  AUTOMATION_SAFETY_STOPS,
} from "./paths.js";
export type {
  ZeroHumanAutomationEngineState,
  ZeroHumanAutomationRequest,
  ZeroHumanAutomationGateResult,
  ZeroHumanAutomationReadinessPipeline,
  ZeroHumanAutomationAssessment,
  ZeroHumanAutomationMetrics,
  ZeroHumanAutomationAnalysis,
  AutomationState,
  AutomationLevel,
  AutomationDomain,
  SubsystemAutomationLevel,
  PhaseP6CompletionReview,
} from "./types.js";
