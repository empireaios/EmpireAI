export { ScalingArchitectureEngine, createScalingArchitectureEngine } from "./engine.js";
export {
  buildScalingArchitectureReadinessPipeline,
  buildScalingArchitectureReadinessPipelineSync,
  evaluateScalingArchitectureBuilderGate,
} from "./builder-gate.js";
export {
  executeScalingArchitectureAssessment,
  buildDefaultScalingSnapshot,
} from "./scaling-assessment.js";
export { CURRENT_ARCHITECTURE_REGISTRY } from "./current-architecture-registry.js";
export {
  SCALING_STAGE_REGISTRY,
  getStage,
  getRecommendedNextStage,
} from "./scaling-stage-registry.js";
export {
  DATABASE_EVOLUTION_REGISTRY,
  RUNTIME_EVOLUTION_REGISTRY,
  SCALING_BOTTLENECK_REGISTRY,
  getBottlenecksForStage,
} from "./evolution-registry.js";
export { formatScalingArchitecturePreamble, prependScalingArchitecture } from "./mission-preamble.js";
export {
  SCALING_ARCHITECTURE_PATH,
  SCALING_DOMAINS,
  SCALING_STAGES,
  SCALING_PRINCIPLES,
  STAGE_DOCUMENTATION_FIELDS,
} from "./paths.js";
export type {
  ScalingArchitectureState,
  ScalingArchitectureRequest,
  ScalingArchitectureBuilderGateResult,
  ScalingArchitectureReadinessPipeline,
  CurrentArchitectureRecord,
  ScalingStageRecord,
  DatabaseEvolutionRecord,
  RuntimeEvolutionRecord,
  ScalingBottleneckRecord,
  ScalingArchitectureSnapshot,
  ScalingArchitectureAssessment,
  ScalingArchitectureMetrics,
  ScalingArchitectureAnalysis,
  ScalingStage,
  ScalingDomain,
} from "./types.js";
