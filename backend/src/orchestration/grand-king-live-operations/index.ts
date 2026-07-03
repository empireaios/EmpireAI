/**
 * G7-00 — Grand King Live Operations Framework public surface.
 */

import { resetLiveOperationsRegistryBatchForTests } from "../../registry/sources/live-operations-source.js";
import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetLiveOperationsObservationStoreForTests } from "./ekls/live-operations-observation-store.js";
import { resetLiveOperationsStateForTests } from "./services/live-operations-service.js";
import { resetFinalLiveOperationsCertificationStateForTests } from "./final-live-operations-certification/services/final-live-operations-certification-service.js";
import { resetFinalLiveLaunchObservationStoreForTests } from "./final-live-operations-certification/ekls/final-live-launch-observation-store.js";
import { resetFinalLiveLaunchPluginHostForTests } from "./final-live-operations-certification/plugins/final-live-launch-plugin-host.js";

export {
  GRAND_KING_LIVE_OPERATIONS_VERSION,
  LIVE_OPERATION_STATES,
  LIVE_OPERATIONS_EKLS_KINDS,
  VALID_STATE_TRANSITIONS,
  type LiveOperationState,
  type LiveOperationDomainId,
  type LiveEnvironment,
  type LiveOperation,
  type LiveOperationRun,
  type LiveOperationsOverview,
  type LiveOperationEvidence,
  type LiveOperationRisk,
  type LiveOperationBlocker,
  type GrandKingOperatingProfile,
  type LiveEnvironmentProfile,
  isValidLiveOperationTransition,
} from "./contracts/live-operations-types.js";

export {
  COCKPIT_LIVE_OPERATIONS_VIEW_ID,
  buildCockpitLiveOperationsView,
  type CockpitLiveOperationsView,
} from "./contracts/live-operations-cockpit-contracts.js";

export {
  GRAND_KING_LIVE_OPERATIONS_MODULE_ID,
  GRAND_KING_LIVE_OPERATIONS_CAPABILITIES,
  createGrandKingLiveOperationsModuleContract,
  type GrandKingLiveOperationsCapability,
  type GrandKingLiveOperationsModuleContract,
} from "./contract/live-operations-module.js";

export {
  resolveLiveOperationDomains,
  resolveGrandKingOperatingProfile,
  resolveLiveEnvironmentProfile,
  listLiveOperationsRegistryIds,
} from "./registry/live-operations-registry-resolver.js";

export {
  validateLiveOperationsPillowGovernance,
  type LiveOperationsPillowContext,
  type LiveOperationsPillowResult,
} from "./governance/live-operations-pillow-governance.js";

export {
  recordLiveOperationsEklsObservation,
  searchLiveOperationsEklsObservations,
  listLiveOperationsEklsKinds,
} from "./ekls/live-operations-ekls-integration.js";

export {
  validateProductionEligibilityGate,
  type ProductionEligibilityGateResult,
} from "./services/production-eligibility-gate.js";

export {
  initializeLiveOperations,
  getLiveOperationsOverview,
  getLastLiveOperationRun,
  getLiveOperation,
  listLiveOperations,
  startLiveOperation,
  pauseLiveOperation,
  resumeLiveOperation,
  blockLiveOperation,
  getLiveOperationEvidence,
  getLiveOperationRisks,
  getLiveOperationNextActions,
} from "./services/live-operations-service.js";

export { grandKingLiveOperationsTools } from "./tools/live-operations-tools.js";

export {
  FINAL_LIVE_OPERATIONS_CERTIFICATION_VERSION,
  LIVE_LAUNCH_OUTCOMES,
  LIVE_CERTIFICATION_DOMAIN_IDS,
  FINAL_LIVE_LAUNCH_EKLS_KINDS,
  G7_MISSION_AUDIT_REFS,
  type LiveLaunchOutcome,
  type FinalLiveOperationsCertificationRecord,
  type FinalLiveOperationsCertificationRunResult,
  type FinalLiveOperationsCertificationOverview,
  type FinalLiveLaunchPluginManifest,
  redactLiveLaunchSecrets,
} from "./final-live-operations-certification/contracts/final-live-operations-certification-types.js";

export {
  COCKPIT_VERSION1_LAUNCH_VIEW_ID,
  buildCockpitVersion1LaunchView,
  type CockpitVersion1LaunchView,
} from "./final-live-operations-certification/contracts/final-live-launch-cockpit-contracts.js";

export {
  resolveFinalLiveCertificationRules,
  listFinalLiveCertificationDomains,
  listFinalLiveCertificationRegistryIds,
} from "./final-live-operations-certification/registry/final-live-certification-registry-resolver.js";

export {
  validateFinalLiveLaunchPillowGovernance,
  type FinalLiveLaunchPillowContext,
  type FinalLiveLaunchPillowResult,
} from "./final-live-operations-certification/governance/final-live-launch-pillow-governance.js";

export {
  recordFinalLiveLaunchEklsObservation,
  searchFinalLiveLaunchEklsObservations,
  listFinalLiveLaunchEklsKinds,
} from "./final-live-operations-certification/ekls/final-live-launch-ekls-integration.js";

export {
  registerFinalLiveLaunchPlugin,
  listFinalLiveLaunchPlugins,
} from "./final-live-operations-certification/plugins/final-live-launch-plugin-host.js";

export {
  runLiveLaunchCertification,
  getFinalLiveOperationsCertificationOverview,
  getLastFinalLiveOperationsCertificationRun,
  getLiveLaunchStatus,
  getLaunchBlockers,
  getLaunchConditions,
  getLaunchRiskRegister,
  getGrandKingLaunchReadinessSummary,
  getVersion1LaunchSummary,
  getLiveOperationHealth,
  getLiveOperationsCompletionSummary,
} from "./final-live-operations-certification/services/final-live-operations-certification-service.js";

export { finalLiveLaunchCertificationTools } from "./final-live-operations-certification/tools/final-live-launch-certification-tools.js";

export {
  LUMINOUSYOU_BRAND_ID,
  GRAND_KING_ACCOUNT_HOLDER_ID,
} from "./data/live-operations-profile-seed.js";

export function resetGrandKingLiveOperationsHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetLiveOperationsRegistryBatchForTests();
  resetLiveOperationsStateForTests();
  resetLiveOperationsObservationStoreForTests();
  resetFinalLiveOperationsCertificationStateForTests();
  resetFinalLiveLaunchObservationStoreForTests();
  resetFinalLiveLaunchPluginHostForTests();
  delete process.env.LIVE_MISSING_EVIDENCE;
  delete process.env.LIVE_CRITICAL_BLOCKER;
  delete process.env.LIVE_LAUNCH_BLOCKED;
  delete process.env.LIVE_LAUNCH_GATE_BLOCKED;
  delete process.env.LIVE_GRAND_KING_NOT_READY;
}
