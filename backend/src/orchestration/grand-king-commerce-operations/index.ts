/**
 * G7-02 — Grand King Commerce Operations public surface.
 */

import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetProductionWorkspaceRegistryBatchForTests } from "../../registry/sources/production-workspace-source.js";
import { resetCommerceOperationsObservationStoreForTests } from "./ekls/commerce-operations-observation-store.js";
import { resetCommerceOperationsPluginHostForTests } from "./plugins/commerce-operations-plugin-host.js";
import { resetCommerceOperationsStateForTests } from "./services/grand-king-commerce-operations-service.js";

export {
  GRAND_KING_COMMERCE_OPERATIONS_VERSION,
  COMMERCE_OPERATION_STATES,
  COMMERCE_OPERATION_TYPES,
  COMMERCE_OPERATIONS_EKLS_KINDS,
  VALID_COMMERCE_OPERATION_TRANSITIONS,
  type CommerceOperationState,
  type CommerceOperationType,
  type CommerceOperation,
  type CommerceOperationRun,
  type CommerceOperationsOverview,
  type CommerceOperationHealthSummary,
  type CommerceOperationDependencySummary,
  type CommerceOperationsEklsKind,
  type CommerceOperationsPluginManifest,
  isValidCommerceOperationTransition,
} from "./contracts/commerce-operations-types.js";

export {
  COCKPIT_COMMERCE_OPERATIONS_VIEW_ID,
  buildCockpitCommerceOperationsView,
  type CockpitCommerceOperationsView,
} from "./contracts/commerce-operations-cockpit-contracts.js";

export {
  GRAND_KING_COMMERCE_OPERATIONS_MODULE_ID,
  GRAND_KING_COMMERCE_OPERATIONS_CAPABILITIES,
  createGrandKingCommerceOperationsModuleContract,
  type GrandKingCommerceOperationsCapability,
  type GrandKingCommerceOperationsModuleContract,
} from "./contract/commerce-operations-module.js";

export {
  resolveCommerceOperationDependencies,
  listCommerceOperationsRegistryIds,
} from "./registry/commerce-operations-registry-resolver.js";

export {
  validateCommerceOperationsPillowGovernance,
  type CommerceOperationsPillowContext,
  type CommerceOperationsPillowResult,
} from "./governance/commerce-operations-pillow-governance.js";

export {
  recordCommerceOperationsEklsObservation,
  searchCommerceOperationsEklsObservations,
  listCommerceOperationsEklsKinds,
} from "./ekls/commerce-operations-ekls-integration.js";

export { resolveProviderOperations, type ProviderOperationDefinition } from "./services/provider-operation-registry.js";
export { validateCommerceReadiness, type CommerceReadinessResult } from "./services/commerce-readiness-validator.js";
export { transitionCommerceOperationStatus } from "./services/operation-lifecycle-manager.js";

export {
  initializeCommerceOperations,
  getLastCommerceOperationRun,
  getCommerceOperation,
  listCommerceOperations,
  getCommerceOperationsOverview,
  startCommerceOperation,
  pauseCommerceOperation,
  resumeCommerceOperation,
  stopCommerceOperation,
  getCommerceOperationHealth,
  getCommerceOperationDependencies,
  getCommerceOperationSummary,
  getExecutiveCommerceDashboard,
  recordCommerceOperationLearning,
  reportCommerceOperationIncident,
} from "./services/grand-king-commerce-operations-service.js";

export {
  registerCommerceOperationsPlugin,
  listCommerceOperationsPlugins,
} from "./plugins/commerce-operations-plugin-host.js";

export { grandKingCommerceOperationsTools } from "./tools/commerce-operations-tools.js";

export function resetGrandKingCommerceOperationsHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetProductionWorkspaceRegistryBatchForTests();
  resetCommerceOperationsStateForTests();
  resetCommerceOperationsObservationStoreForTests();
  resetCommerceOperationsPluginHostForTests();
  delete process.env.COMMERCE_READINESS_BLOCKED;
  delete process.env.COMMERCE_OPERATION_DEGRADED;
}
