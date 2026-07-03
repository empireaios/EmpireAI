/**
 * G8-09 — Identity & Authorization Plugin Integration public surface.
 */

import { resetIdentityPluginObservationStoreForTests } from "./ekls/identity-plugin-observation-store.js";
import {
  resetIdentityPluginLifecycleManagerForTests,
} from "./services/identity-plugin-lifecycle-manager.js";
import { resetIdentityPluginDomainRouterForTests } from "./router/identity-plugin-domain-router.js";

export {
  IDENTITY_PLUGIN_INTEGRATION_VERSION,
  IDENTITY_PLUGIN_CATEGORIES,
  IDENTITY_PLUGIN_LIFECYCLE_STATES,
  IDENTITY_PLUGIN_EKLS_KINDS,
  identityPluginManifestSchema,
  type IdentityPluginCategory,
  type IdentityPluginLifecycleState,
  type IdentityPluginHealthStatus,
  type IdentityPluginEklsKind,
  type IdentityPluginManifest,
  type IdentityPluginRecord,
  type IdentityPluginRegistrationResult,
  type IdentityPluginValidationResult,
  type IdentityPluginCapabilitySummary,
  type ResolvedIdentityPluginPolicy,
  type IdentityPluginDiscoveryResult,
  redactIdentityPluginSecrets,
  assertNoSecretsInIdentityPluginPayload,
} from "./contracts/identity-plugin-types.js";

export {
  buildIdentityPluginCockpitView,
  type IdentityPluginCockpitSummary,
  type IdentityPluginCockpitView,
  type IdentityPluginCockpitInstalledPlugin,
} from "./contracts/identity-plugin-cockpit-contracts.js";

export {
  IDENTITY_PLUGIN_INTEGRATION_MODULE_ID,
  IDENTITY_PLUGIN_INTEGRATION_CAPABILITIES,
  createIdentityPluginIntegrationModuleContract,
  type IdentityPluginIntegrationCapability,
  type IdentityPluginIntegrationModuleContract,
} from "./contract/identity-plugin-module.js";

export {
  IDENTITY_PLUGIN_FRAMEWORK_SOURCE,
  IDENTITY_PLUGIN_CATEGORY_TO_KIND,
  registerIdentityPluginThroughFramework,
  listIdentityPluginsFromFramework,
} from "./framework/identity-plugin-framework-bridge.js";

export {
  IDENTITY_PLUGIN_CATEGORY_TO_TARGET_REGISTRY,
  resolveIdentityPluginRegistryPolicy,
  previewIdentityPluginRegistryPolicy,
} from "./registry/identity-plugin-registry-policy-resolver.js";

export {
  resolveIdentityPluginCapabilities,
  resolveIdentityPluginProviderCoverage,
  listIdentityPluginCapabilitiesForWorkspace,
} from "./registry/identity-plugin-capability-resolver.js";

export {
  validateIdentityPluginCompatibility,
  validateIdentityPlugin,
} from "./services/identity-plugin-compatibility-service.js";

export {
  evaluateIdentityPluginHealth,
  applyIdentityPluginHealthReport,
  type IdentityPluginHealthReport,
} from "./services/identity-plugin-health-service.js";

export {
  IdentityPluginLifecycleManager,
  getIdentityPluginHost,
  registerIdentityPlugin,
  enableIdentityPlugin,
  disableIdentityPlugin,
  discoverIdentityPlugins,
  listIdentityPlugins,
  getIdentityPluginDetail,
  listIdentityPluginCapabilities,
  checkIdentityPluginHealth,
  resetIdentityPluginLifecycleManagerForTests,
} from "./services/identity-plugin-lifecycle-manager.js";

export {
  IdentityPluginDomainRouter,
  getIdentityPluginDomainRouter,
  resetIdentityPluginDomainRouterForTests,
  type IdentityPluginRegistrationContext,
} from "./router/identity-plugin-domain-router.js";

export {
  validateIdentityPluginManifestStructure,
  validateIdentityPluginTrust,
  validateIdentityPluginLifecycleGovernance,
  validateIdentityPluginEligibility,
  type IdentityPluginGovernanceResult,
} from "./governance/identity-plugin-pillow-governance.js";

export {
  recordIdentityPluginEklsObservation,
  searchIdentityPluginEklsObservations,
  listIdentityPluginEklsKinds,
} from "./ekls/identity-plugin-ekls-integration.js";

export { identityPluginTools } from "./tools/identity-plugin-tools.js";

export function resetIdentityPluginIntegrationHarnessForTests(): void {
  resetIdentityPluginLifecycleManagerForTests();
  resetIdentityPluginDomainRouterForTests();
  resetIdentityPluginObservationStoreForTests();
}
