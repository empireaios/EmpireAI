/**
 * G7-07 — Grand King Autonomous Operations public surface.
 */

import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetProductionWorkspaceRegistryBatchForTests } from "../../registry/sources/production-workspace-source.js";
import { resetAutonomousObservationStoreForTests } from "./ekls/autonomous-operations-observation-store.js";
import { resetAutonomousOperationsPluginHostForTests } from "./plugins/autonomous-operations-plugin-host.js";
import { resetAutonomousOperationStoreForTests } from "./services/autonomous-operation-store.js";
import { resetAutonomousOperationsStateForTests } from "./services/grand-king-autonomous-operations-service.js";

export {
  GRAND_KING_AUTONOMOUS_OPERATIONS_VERSION,
  AUTONOMOUS_DOMAIN_IDS,
  AUTONOMOUS_EXECUTION_STATUSES,
  AUTONOMY_LEVELS,
  AUTONOMOUS_OPERATION_TYPES,
  AUTONOMOUS_HEALTH_STATUSES,
  AUTONOMOUS_EKLS_KINDS,
  VALID_AUTONOMOUS_TRANSITIONS,
  type AutonomousDomainId,
  type AutonomousExecutionStatus,
  type AutonomyLevel,
  type AutonomousOperationType,
  type AutonomousHealthStatus,
  type AutonomousOperation,
  type AutonomousOperationsOverview,
  type AutonomousQueueEntry,
  type AutonomousHistoryEntry,
  type AutonomousHealthSummary,
  type AutonomousRecommendation,
  type AutonomousEklsKind,
  type AutonomousOperationsPluginManifest,
  isValidAutonomousTransition,
  redactAutonomousSecrets,
} from "./contracts/autonomous-operations-types.js";

export {
  COCKPIT_AUTONOMOUS_OPERATIONS_VIEW_ID,
  buildCockpitAutonomousOperationsView,
  type CockpitAutonomousOperationsView,
} from "./contracts/autonomous-operations-cockpit-contracts.js";

export {
  GRAND_KING_AUTONOMOUS_OPERATIONS_MODULE_ID,
  GRAND_KING_AUTONOMOUS_OPERATIONS_CAPABILITIES,
  createGrandKingAutonomousOperationsModuleContract,
  type GrandKingAutonomousOperationsCapability,
  type GrandKingAutonomousOperationsModuleContract,
} from "./contract/autonomous-operations-module.js";

export {
  resolveAutonomousOperationDependencies,
  listAutonomousOperationsRegistryIds,
  deriveAutonomySignalFromRef,
  resolveOperationTypeForDomain,
  mapDomainToTargetModule,
} from "./registry/autonomous-operations-registry-resolver.js";

export { evaluateAutonomyPolicy, evaluateAllAutonomyPolicies } from "./services/autonomy-policy-evaluator.js";
export { evaluateAutonomyApproval } from "./services/autonomy-approval-evaluator.js";
export { routeAutonomousDecisions } from "./services/autonomous-decision-router.js";
export { validateAutonomousSafety } from "./services/autonomous-safety-validator.js";
export {
  scheduleAutonomousOperation,
  startAutonomousExecution,
  completeAutonomousExecution,
} from "./services/autonomous-execution-scheduler.js";
export { monitorAutonomousOperations, buildAutonomousQueue } from "./services/autonomous-execution-monitor.js";
export { rollbackAutonomousOperation } from "./services/autonomous-rollback-integration.js";
export { recordAutonomousLearningBaseline } from "./services/autonomous-learning-integration.js";
export {
  buildExecutiveAutonomyDashboard,
  getExecutiveAutonomySummary,
} from "./services/executive-autonomy-dashboard.js";

export {
  validateAutonomousOperationsPillowGovernance,
  type AutonomousOperationsPillowContext,
  type AutonomousOperationsPillowResult,
} from "./governance/autonomous-operations-pillow-governance.js";

export {
  recordAutonomousEklsObservation,
  searchAutonomousEklsObservations,
  listAutonomousEklsKinds,
} from "./ekls/autonomous-operations-ekls-integration.js";

export {
  initializeAutonomousOperations,
  getAutonomousOperationsOverview,
  pauseAutonomousOperation,
  resumeAutonomousOperation,
  cancelAutonomousOperation,
  getAutonomousOperationStatus,
  getAutonomousOperation,
  listAutonomousOperations,
} from "./services/grand-king-autonomous-operations-service.js";

export {
  registerAutonomousOperationsPlugin,
  listAutonomousOperationsPlugins,
} from "./plugins/autonomous-operations-plugin-host.js";

export { grandKingAutonomousOperationsTools } from "./tools/autonomous-operations-tools.js";

export function resetGrandKingAutonomousOperationsHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetProductionWorkspaceRegistryBatchForTests();
  resetAutonomousOperationsStateForTests();
  resetAutonomousOperationStoreForTests();
  resetAutonomousObservationStoreForTests();
  resetAutonomousOperationsPluginHostForTests();
  delete process.env.AUTONOMOUS_EMERGENCY_STOP;
}
