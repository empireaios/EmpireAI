/**
 * G8-01 — Connection Registry public surface.
 */

import { resetConnectionRegistryBatchForTests } from "../../../registry/sources/connection-registry-source.js";
import { resetRegistryLoaderForTests } from "../../../registry/registry-loader.js";
import { resetConnectionRegistryObservationStoreForTests } from "./ekls/connection-registry-observation-store.js";
import { resetConnectionRegistryPluginHostForTests } from "./plugins/connection-registry-plugin-host.js";
import { resetConnectionRegistryStateForTests } from "./services/connection-registry-service.js";

export {
  CONNECTION_REGISTRY_FOUNDATION_VERSION,
  CONNECTION_REGISTRY_PROVIDER_IDS,
  PROVIDER_CATEGORIES,
  CONNECTION_STATUSES,
  READINESS_STATES,
  CONNECTION_REGISTRY_EKLS_KINDS,
  type ConnectionRegistryProviderId,
  type ProviderCategory,
  type ConnectionStatus,
  type ReadinessState,
  type ConnectionRegistryEklsKind,
  type ConnectionDefinition,
  type WorkspaceConnectionProfile,
  type ConnectionRegistryPluginManifest,
  redactConnectionRegistrySecrets,
} from "./contracts/connection-registry-types.js";

export {
  COCKPIT_CONNECTION_REGISTRY_MODULE_ID,
  createCockpitAuthorizationCentreRouteRegistration,
  buildCockpitConnectionRegistryView,
  type CockpitAuthorizationCentreRouteRegistration,
  type CockpitConnectionRegistryView,
} from "./contracts/connection-registry-cockpit-contracts.js";

export {
  CONNECTION_REGISTRY_MODULE_ID,
  CONNECTION_REGISTRY_CAPABILITIES,
  createConnectionRegistryModuleContract,
  type ConnectionRegistryCapability,
  type ConnectionRegistryModuleContract,
} from "./contract/connection-registry-module.js";

export {
  listConnectionRegistryIds,
  resolveConnectionProvider,
  resolveAllConnectionProviders,
  resolveConnectionRequirements,
  resolveProviderCapabilities,
  resolveConnectionDependencies,
  resolveWorkspaceConnectionProfile,
  resolveConnectionScopes,
  resolveConnectionPermissions,
  resolveConnectionAccountHolders,
  resolveConnectionTypes,
} from "./registry/connection-registry-resolver.js";

export {
  validateConnectionRegistryPillowGovernance,
  type ConnectionRegistryPillowContext,
  type ConnectionRegistryPillowResult,
} from "./governance/connection-registry-pillow-governance.js";

export {
  recordConnectionRegistryEklsObservation,
  searchConnectionRegistryEklsObservations,
  listConnectionRegistryEklsKinds,
} from "./ekls/connection-registry-ekls-integration.js";

export {
  registerConnectionRegistryPlugin,
  listConnectionRegistryPlugins,
} from "./plugins/connection-registry-plugin-host.js";

export {
  initializeConnectionRegistry,
  getConnectionRegistryList,
  getConnectionProviderDetail,
  getConnectionRequirements,
  getConnectionCapabilities,
  getConnectionDependencies,
  getWorkspaceConnectionProfile,
  isConnectionRegistryInitialized,
} from "./services/connection-registry-service.js";

export { connectionRegistryTools } from "./tools/connection-registry-tools.js";

export function resetConnectionRegistryHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetConnectionRegistryBatchForTests();
  resetConnectionRegistryStateForTests();
  resetConnectionRegistryObservationStoreForTests();
  resetConnectionRegistryPluginHostForTests();
}
