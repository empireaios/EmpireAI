/**
 * G7-03 — Grand King Business Automation Operations public surface.
 */

import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetAutomationOperationsObservationStoreForTests } from "./ekls/automation-operations-observation-store.js";
import { resetAutomationOperationsPluginHostForTests } from "./plugins/automation-operations-plugin-host.js";
import { resetAutomationOperationsStateForTests } from "./services/grand-king-business-automation-operations-service.js";

export {
  GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_VERSION,
  AUTOMATION_OPERATION_STATES,
  AUTOMATION_HEALTH_STATUSES,
  AUTOMATION_OPERATION_DOMAIN_IDS,
  AUTOMATION_OPERATIONS_EKLS_KINDS,
  VALID_AUTOMATION_OPERATION_TRANSITIONS,
  type AutomationOperationState,
  type AutomationHealthStatus,
  type AutomationOperationDomainId,
  type AutomationOperation,
  type AutomationOperationRun,
  type AutomationOperationsOverview,
  type AutomationOperationHealthSummary,
  type AutomationOperationDependencySummary,
  type AutomationOperationsEklsKind,
  type AutomationOperationsPluginManifest,
  type WorkflowQueueSummary,
  type ActiveExecutionSummary,
  type ApprovalQueueSummary,
  type RecoverySummary,
  isValidAutomationOperationTransition,
} from "./contracts/automation-operations-types.js";

export {
  COCKPIT_AUTOMATION_OPERATIONS_VIEW_ID,
  buildCockpitAutomationOperationsView,
  type CockpitAutomationOperationsView,
} from "./contracts/automation-operations-cockpit-contracts.js";

export {
  GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_MODULE_ID,
  GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_CAPABILITIES,
  createGrandKingBusinessAutomationOperationsModuleContract,
  type GrandKingBusinessAutomationOperationsCapability,
  type GrandKingBusinessAutomationOperationsModuleContract,
} from "./contract/automation-operations-module.js";

export {
  resolveAutomationOperationDependencies,
  resolveAutomationOperationDomains,
  resolveAutomationRegistryRefs,
  listAutomationOperationsRegistryIds,
} from "./registry/automation-operations-registry-resolver.js";

export {
  validateAutomationOperationsPillowGovernance,
  type AutomationOperationsPillowContext,
  type AutomationOperationsPillowResult,
} from "./governance/automation-operations-pillow-governance.js";

export {
  recordAutomationOperationsEklsObservation,
  searchAutomationOperationsEklsObservations,
  listAutomationOperationsEklsKinds,
} from "./ekls/automation-operations-ekls-integration.js";

export { validateAutomationReadiness, type AutomationReadinessResult } from "./services/automation-readiness-validator.js";
export { transitionAutomationOperationStatus } from "./services/automation-lifecycle-manager.js";
export {
  evaluateAutomationOperationHealth,
  evaluateAggregateAutomationHealth,
} from "./services/automation-health-evaluator.js";
export { launchProductionWorkflow } from "./services/production-workflow-launcher.js";
export { monitorWorkflowExecutions } from "./services/workflow-execution-monitor.js";
export { integrateProductionScheduler } from "./services/production-scheduler-integration.js";
export { integrateApprovalQueue } from "./services/approval-queue-integration.js";
export { integrateRecoveryOperations } from "./services/recovery-integration.js";

export {
  initializeAutomationOperations,
  getLastAutomationOperationRun,
  getAutomationOperation,
  listAutomationOperations,
  getAutomationOperationsOverview,
  startAutomationOperation,
  pauseAutomationOperation,
  resumeAutomationOperation,
  cancelAutomationOperation,
  getAutomationOperationHealth,
  getAutomationOperationDependencies,
  getAutomationOperationSummary,
  getExecutiveAutomationDashboard,
  recordAutomationOperationLearning,
  failAutomationOperation,
  recoverAutomationOperation,
} from "./services/grand-king-business-automation-operations-service.js";

export {
  registerAutomationOperationsPlugin,
  listAutomationOperationsPlugins,
} from "./plugins/automation-operations-plugin-host.js";

export { grandKingBusinessAutomationOperationsTools } from "./tools/automation-operations-tools.js";

export function resetGrandKingBusinessAutomationOperationsHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetAutomationOperationsStateForTests();
  resetAutomationOperationsObservationStoreForTests();
  resetAutomationOperationsPluginHostForTests();
  delete process.env.AUTOMATION_READINESS_BLOCKED;
  delete process.env.AUTOMATION_OPERATION_DEGRADED;
}
