export {
  ProductEvaluationWorker,
  createProductEvaluationWorker,
  resetProductEvaluationWorkerForTesting,
  type ProductEvaluationWorkerOptions,
} from "./engine.js";
export type { ProductEvaluationWorkerDependencies } from "./integrations.js";
export {
  buildProductEvaluationWorkerConfiguration,
  DEFAULT_PRODUCT_EVALUATION_WORKER_CONFIGURATION,
  type ProductEvaluationWorkerConfiguration,
} from "./configuration.js";
export {
  PRODUCT_EVALUATION_WORKER_ID,
  PRODUCT_EVALUATION_WORKER_SYSTEM_PATH,
  PRODUCT_EVALUATION_WORKER_IDENTITY,
  PEW_METADATA_VERSION,
  PRODUCT_EVALUATION_REPORT_VERSION,
  RECOMMENDATIONS,
  SCORE_DIMENSIONS,
  PEW_CAPABILITIES,
  INTEGRATION_TARGETS as PEW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  ProductEvaluationWorkerState,
  ProductEvaluationReport as PewProductEvaluationReport,
  ProductEvaluationWorkerInput,
  ProductEvaluationWorkerRunReport,
  ProductEvaluationWorkerCatalog,
  ProductEvaluationWorkerCockpitSnapshot,
  ProductEvaluationWorkerEngineRecord,
  ProductEvaluationWorkerValidationReport,
  DiscoveredProductInput as PewDiscoveredProductInput,
  EvidenceItem as PewEvidenceItem,
  EvaluationRecommendation as PewEvaluationRecommendation,
  IntegrationHandshake as PewIntegrationHandshake,
} from "./types.js";
