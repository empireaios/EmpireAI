export {
  AutonomousImprovementEngine,
  createAutonomousImprovementEngine,
  IMPROVEMENT_DOCTRINE_PATH,
} from "./engine.js";
export { generateProposalFromObservation } from "./proposal-generator.js";
export {
  verifyDependencies,
  determineMissionReadiness,
  buildMissionSequence,
} from "./readiness-engine.js";
export { collectEvidence, analyzeImpact } from "./evidence-collector.js";
export {
  validateApproval,
  canProceedToMissionGeneration,
  createApproval,
  approvalRecommendation,
} from "./approval-gate.js";
export {
  mapKindToDomain,
  inferContracts,
  inferModules,
} from "./domain-mapper.js";
export type {
  ImprovementDomain,
  ImprovementLifecycleStage,
  MissionReadiness,
  ImprovementApprovalOutcome,
  ImprovementProposal,
  DependencyCheck,
  ImprovementApproval,
  ImprovementBatch,
  ImprovementEngineState,
  ImprovementEngineOptions,
  GenerateImprovementsRequest,
  ImprovementExecutionResult,
} from "./types.js";
