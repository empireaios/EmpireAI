/**
 * G7-06 — Grand King Continuous Intelligence & Optimization public surface.
 */

import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetProductionWorkspaceRegistryBatchForTests } from "../../registry/sources/production-workspace-source.js";
import { resetOptimizationObservationStoreForTests } from "./ekls/continuous-intelligence-observation-store.js";
import { resetContinuousIntelligencePluginHostForTests } from "./plugins/continuous-intelligence-plugin-host.js";
import { resetOptimizationStoreForTests } from "./services/optimization-store.js";
import { resetOptimizationSchedulerForTests } from "./services/optimization-scheduler.js";
import { resetContinuousIntelligenceStateForTests } from "./services/grand-king-continuous-intelligence-optimization-service.js";

export {
  GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_VERSION,
  OPTIMIZATION_DOMAIN_IDS,
  OPTIMIZATION_TYPES,
  OPTIMIZATION_STATUSES,
  OPTIMIZATION_PRIORITIES,
  OPTIMIZATION_EKLS_KINDS,
  VALID_OPTIMIZATION_TRANSITIONS,
  type OptimizationDomainId,
  type OptimizationType,
  type OptimizationStatus,
  type OptimizationPriority,
  type OptimizationRecommendation,
  type OptimizationOpportunity,
  type OptimizationAnomaly,
  type OptimizationRoiSummary,
  type OptimizationPriorityQueueEntry,
  type OptimizationHistoryEntry,
  type OptimizationOperationsOverview,
  type OptimizationEklsKind,
  type OptimizationPluginManifest,
  isValidOptimizationTransition,
  redactOptimizationSecrets,
} from "./contracts/continuous-intelligence-types.js";

export {
  COCKPIT_CONTINUOUS_INTELLIGENCE_VIEW_ID,
  buildCockpitContinuousIntelligenceView,
  type CockpitContinuousIntelligenceView,
} from "./contracts/continuous-intelligence-cockpit-contracts.js";

export {
  GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_MODULE_ID,
  GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_CAPABILITIES,
  createGrandKingContinuousIntelligenceOptimizationModuleContract,
  type GrandKingContinuousIntelligenceOptimizationCapability,
  type GrandKingContinuousIntelligenceOptimizationModuleContract,
} from "./contract/continuous-intelligence-module.js";

export {
  resolveOptimizationPolicies,
  resolveOptimizationDependencies,
  listContinuousIntelligenceRegistryIds,
  deriveSignalFromRuleRef,
  mapDomainToSubsystem,
  mapDomainToOptimizationType,
} from "./registry/continuous-intelligence-registry-resolver.js";

export {
  validateContinuousIntelligencePillowGovernance,
  type ContinuousIntelligencePillowContext,
  type ContinuousIntelligencePillowResult,
} from "./governance/continuous-intelligence-pillow-governance.js";

export {
  recordOptimizationEklsObservation,
  searchOptimizationEklsObservations,
  listOptimizationEklsKinds,
} from "./ekls/continuous-intelligence-ekls-integration.js";

export { detectOptimizationOpportunities } from "./services/opportunity-detector.js";
export { detectOptimizationAnomalies } from "./services/anomaly-detector.js";
export { generateOptimizationRecommendations } from "./services/optimization-engine.js";
export {
  runPerformanceOptimiser,
  runCommerceOptimiser,
  runAutomationOptimiser,
  runWorkflowOptimiser,
  runFinancialOptimiser,
  runAllDomainOptimisers,
} from "./services/domain-optimisers.js";
export { prioritiseOptimizationRecommendations, computeOptimizationRoi } from "./services/recommendation-prioritiser.js";
export { scheduleOptimization, completeOptimization, listOptimizationHistory } from "./services/optimization-scheduler.js";
export {
  buildExecutiveOptimizationDashboard,
  getExecutiveOptimizationSummary,
  listOptimizationOpportunities,
} from "./services/executive-optimization-dashboard.js";

export {
  initializeContinuousIntelligenceOptimization,
  getOptimizationOperationsOverview,
  approveOptimization,
  executeOptimization,
  getOptimizationStatus,
  getOptimizationRecommendation,
  listOptimizationRecommendations,
} from "./services/grand-king-continuous-intelligence-optimization-service.js";

export {
  registerContinuousIntelligencePlugin,
  listContinuousIntelligencePlugins,
} from "./plugins/continuous-intelligence-plugin-host.js";

export { grandKingContinuousIntelligenceOptimizationTools } from "./tools/continuous-intelligence-tools.js";

export function resetGrandKingContinuousIntelligenceOptimizationHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetProductionWorkspaceRegistryBatchForTests();
  resetContinuousIntelligenceStateForTests();
  resetOptimizationStoreForTests();
  resetOptimizationSchedulerForTests();
  resetOptimizationObservationStoreForTests();
  resetContinuousIntelligencePluginHostForTests();
  delete process.env.OPTIMIZATION_ANOMALY_SIGNAL;
}
