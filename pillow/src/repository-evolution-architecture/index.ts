export {
  assembleRepositoryEvolutionArchitecture,
  buildFallbackRepositoryEvolutionArchitecture,
} from "./assembler.js";
export {
  REPOSITORY_EVOLUTION_ARCHITECTURE_PATH,
  REPOSITORY_EVOLUTION_PIPELINE,
  EVOLUTION_PRINCIPLES,
  GOVERNED_DOMAINS,
  EVOLUTION_CAPABILITIES,
  HEALTH_EVALUATIONS,
  REPOSITORY_HEALTH_DOMAINS,
  DRIFT_DETECTION_TYPES,
  IMPROVEMENT_TYPES,
  CHANGE_GOVERNANCE_FIELDS,
} from "./paths.js";
export type {
  RepositoryEvolutionArchitecture,
  RepositoryImprovement,
  RepositoryEvolutionRecommendation,
  EvolutionPipelineStep,
  EvolutionPipelinePhase,
  RepositoryHealthMetric,
  DriftDetectionRecord,
} from "./types.js";
