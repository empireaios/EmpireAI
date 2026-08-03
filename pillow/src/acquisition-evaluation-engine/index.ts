/** PILLOW-AEE-001 — Acquisition Evaluation Engine exports (X2-15). */

export {
  AcquisitionEvaluationEngine,
  createAcquisitionEvaluationEngine,
  resetAcquisitionEvaluationEngineForTesting,
  type AcquisitionEvaluationEngineDependencies,
  type AcquisitionEvaluationEngineOptions,
} from "./engine.js";

export {
  buildAcquisitionEvaluationEngineConfiguration,
  DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION,
  type AcquisitionEvaluationEngineConfiguration,
} from "./configuration.js";

export {
  ACQUISITION_EVALUATION_ENGINE_SYSTEM_PATH,
  AEE_METADATA_VERSION,
  ACQUISITION_EVALUATION_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  AEE_CAPABILITIES,
  RECOMMENDATION_TYPES,
} from "./paths.js";

export { appendAeeLog, getAeeLogs, resetAeeLogsForTesting } from "./aee-logging.js";

export type {
  AcquisitionEvaluationEngineState,
  AcquisitionRecord,
  AcquisitionRecommendation,
  AcquisitionEvaluationEngineRecord,
  AcquisitionRunReport,
  AcquisitionCockpitSnapshot,
  AcquisitionHealthReport,
  AcquisitionPerformanceStats,
  ConnectAcquisitionEvaluationEngineInput,
  DiscoverAcquisitionCandidatesInput,
  EvaluateAcquisitionInput,
  RankAcquisitionOpportunitiesInput,
  GenerateAcquisitionRecommendationsInput,
  RunAcquisitionDiagnosticsInput,
} from "./types.js";
