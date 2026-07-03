/**
 * G7-08 — Grand King Self-Healing Operations public surface.
 */

import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetProductionWorkspaceRegistryBatchForTests } from "../../registry/sources/production-workspace-source.js";
import { resetSelfHealingObservationStoreForTests } from "./ekls/self-healing-observation-store.js";
import { resetSelfHealingPluginHostForTests } from "./plugins/self-healing-plugin-host.js";
import { resetHealingStoreForTests } from "./services/healing-action-store.js";
import { resetSelfHealingStateForTests } from "./services/grand-king-self-healing-operations-service.js";

export {
  GRAND_KING_SELF_HEALING_OPERATIONS_VERSION,
  SELF_HEALING_DOMAIN_IDS,
  HEALTH_STATES,
  HEALING_ACTIONS,
  HEALING_EXECUTION_STATUSES,
  SELF_HEALING_EKLS_KINDS,
  VALID_HEALING_TRANSITIONS,
  type SelfHealingDomainId,
  type HealthState,
  type HealingAction,
  type HealingExecutionStatus,
  type HealingActionRecord,
  type HealthDegradationSignal,
  type HealingRecommendation,
  type SelfHealingOverview,
  type HealingQueueEntry,
  type RecoveryConfidenceSummary,
  type SelfHealingStatistics,
  type SelfHealingEklsKind,
  type SelfHealingPluginManifest,
  isValidHealingTransition,
  redactSelfHealingSecrets,
} from "./contracts/self-healing-types.js";

export {
  COCKPIT_SELF_HEALING_VIEW_ID,
  buildCockpitSelfHealingView,
  type CockpitSelfHealingView,
} from "./contracts/self-healing-cockpit-contracts.js";

export {
  GRAND_KING_SELF_HEALING_OPERATIONS_MODULE_ID,
  GRAND_KING_SELF_HEALING_OPERATIONS_CAPABILITIES,
  createGrandKingSelfHealingOperationsModuleContract,
  type GrandKingSelfHealingOperationsCapability,
  type GrandKingSelfHealingOperationsModuleContract,
} from "./contract/self-healing-module.js";

export {
  resolveSelfHealingDependencies,
  listSelfHealingRegistryIds,
  deriveHealingSignalFromRef,
  mapDomainToSubsystem,
} from "./registry/self-healing-registry-resolver.js";

export {
  validateSelfHealingPillowGovernance,
  type SelfHealingPillowContext,
  type SelfHealingPillowResult,
} from "./governance/self-healing-pillow-governance.js";

export {
  recordSelfHealingEklsObservation,
  searchSelfHealingEklsObservations,
  listSelfHealingEklsKinds,
} from "./ekls/self-healing-ekls-integration.js";

export { detectHealthDegradation, computeOverallHealth } from "./services/health-degradation-detector.js";
export { generateHealingRecommendations } from "./services/healing-recommendation-engine.js";
export { executeHealingAction, pauseHealingAction } from "./services/automatic-recovery-coordinator.js";
export { coordinateProductionRollback } from "./services/production-rollback-coordinator.js";
export { evaluateDependencyHealth, evaluateAllDependencyHealth } from "./services/dependency-health-evaluator.js";
export { planSubsystemRecovery } from "./services/subsystem-recovery-planner.js";
export { scoreRecoveryConfidence, computeRecoveryConfidenceSummary } from "./services/recovery-confidence-scorer.js";
export {
  buildHealingQueue,
  computeSelfHealingStatistics,
  getActiveRecoveries,
} from "./services/healing-execution-monitor.js";
export { collectHealingEvidence } from "./services/healing-evidence-collector.js";
export {
  buildExecutiveHealingDashboard,
  getExecutiveSelfHealingSummary,
} from "./services/executive-healing-dashboard.js";

export {
  initializeSelfHealingOperations,
  getSelfHealingOverview,
  getSelfHealingStatus,
  getHealingAction,
  listHealingActions,
} from "./services/grand-king-self-healing-operations-service.js";

export { registerSelfHealingPlugin, listSelfHealingPlugins } from "./plugins/self-healing-plugin-host.js";
export { listHealingHistory, appendHealingAction } from "./services/healing-action-store.js";

export { grandKingSelfHealingOperationsTools } from "./tools/self-healing-tools.js";

export function resetGrandKingSelfHealingOperationsHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetProductionWorkspaceRegistryBatchForTests();
  resetSelfHealingStateForTests();
  resetHealingStoreForTests();
  resetSelfHealingObservationStoreForTests();
  resetSelfHealingPluginHostForTests();
  delete process.env.SELF_HEALING_DEGRADATION_SIGNAL;
}
