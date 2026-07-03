/**
 * G8-00 — Identity & Authorization Platform public surface.
 */

import { resetIdentityAuthorizationRegistryBatchForTests } from "../../registry/sources/identity-authorization-source.js";
import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetIdentityAuthorizationObservationStoreForTests } from "./ekls/identity-authorization-observation-store.js";
import { resetIdentityAuthorizationPluginHostForTests } from "./plugins/identity-authorization-plugin-host.js";
import { resetIdentityAuthorizationStateForTests } from "./services/identity-authorization-service.js";
import { resetIdentityPlatformHealthRegistrationForTests } from "./services/identity-health-registration.js";
import { resetConnectionRegistryHarnessForTests } from "./connection-registry/index.js";
import { resetAuthorizationFrameworkHarnessForTests } from "./authorization-framework/index.js";
import { resetCredentialVaultHarnessForTests } from "./credential-vault-integration/index.js";
import { resetConnectionHealthHarnessForTests } from "./connection-health-monitoring/index.js";
import { resetAuthorizationCentreHarnessForTests } from "./authorization-centre/index.js";
import { resetOperationalReadinessHarnessForTests } from "./operational-readiness-engine/index.js";
import { resetAutomaticReauthorizationHarnessForTests } from "./automatic-reauthorization/index.js";
import { resetMultiWorkspaceIsolationHarnessForTests } from "./multi-workspace-isolation/index.js";
import { resetIdentityPluginIntegrationHarnessForTests } from "./identity-plugin-integration/index.js";

export {
  IDENTITY_AUTHORIZATION_PLATFORM_VERSION,
  IDENTITY_LEARNING_RECORD_KINDS,
  FOUNDATION_PROVIDER_IDS,
  CONNECTION_STATES,
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
  type FoundationProviderId,
  type ConnectionState,
  type IdentityLearningRecordKind,
  type ProviderConnectionState,
  type IdentityPlatformSummary,
  type IdentityPlatformOverview,
  type IdentityHealthSummary,
  type IdentityAuthorizationPluginManifest,
  redactIdentityAuthorizationSecrets,
} from "./contracts/identity-authorization-types.js";

export {
  COCKPIT_IDENTITY_AUTHORIZATION_MODULE_ID,
  createCockpitIdentityAuthorizationRouteRegistration,
  buildCockpitIdentityAuthorizationView,
  type CockpitIdentityAuthorizationRouteRegistration,
  type CockpitIdentityAuthorizationView,
} from "./contracts/identity-authorization-cockpit-contracts.js";

export {
  IDENTITY_AUTHORIZATION_MODULE_ID,
  IDENTITY_AUTHORIZATION_CAPABILITIES,
  createIdentityAuthorizationModuleContract,
  type IdentityAuthorizationCapability,
  type IdentityAuthorizationModuleContract,
} from "./contract/identity-authorization-module.js";

export {
  listIdentityPlatformRegistryIds,
  resolveAuthorizationProviders,
  resolveIdentityPlatformDependencies,
  resolveProviderConnectionStates,
  computeReadinessPercentage,
  deriveConnectionStateFromRef,
} from "./registry/identity-authorization-registry-resolver.js";

export {
  validateIdentityAuthorizationPillowGovernance,
  type IdentityAuthorizationPillowContext,
  type IdentityAuthorizationPillowResult,
} from "./governance/identity-authorization-pillow-governance.js";

export {
  recordIdentityAuthorizationEklsObservation,
  searchIdentityAuthorizationEklsObservations,
  listIdentityAuthorizationEklsKinds,
} from "./ekls/identity-authorization-ekls-integration.js";

export {
  registerIdentityAuthorizationPlugin,
  listIdentityAuthorizationPlugins,
} from "./plugins/identity-authorization-plugin-host.js";

export {
  bootstrapIdentityPlatform,
  type IdentityPlatformBootstrapResult,
} from "./services/platform-bootstrap.js";

export {
  registerIdentityPlatformHealthProbe,
  getIdentityPlatformHealthProbe,
  listIdentityPlatformHealthProbes,
  type IdentityPlatformHealthProbe,
} from "./services/identity-health-registration.js";

export {
  loadIdentityPlatform,
  getIdentityPlatformOverview,
  getIdentityPlatformSummary,
  getIdentityHealth,
  listIdentityProviders,
  getIdentityProviderDetail,
  getConnectionStatus,
  getOverallReadiness,
  recordIdentityExecutiveAction,
} from "./services/identity-authorization-service.js";

export { identityAuthorizationTools } from "./tools/identity-authorization-tools.js";

export {
  CONNECTION_REGISTRY_FOUNDATION_VERSION,
  CONNECTION_REGISTRY_PROVIDER_IDS,
  CONNECTION_STATUSES,
  READINESS_STATES,
  CONNECTION_REGISTRY_EKLS_KINDS,
  createConnectionRegistryModuleContract,
  connectionRegistryTools,
  initializeConnectionRegistry,
  getConnectionRegistryList,
  getConnectionProviderDetail,
  getConnectionRequirements,
  getConnectionCapabilities,
  getConnectionDependencies,
  getWorkspaceConnectionProfile,
  listConnectionRegistryIds,
  resolveAllConnectionProviders,
  validateConnectionRegistryPillowGovernance,
  recordConnectionRegistryEklsObservation,
  searchConnectionRegistryEklsObservations,
  registerConnectionRegistryPlugin,
  redactConnectionRegistrySecrets,
  resetConnectionRegistryHarnessForTests,
} from "./connection-registry/index.js";

export {
  AUTHORIZATION_FRAMEWORK_VERSION,
  AUTHORIZATION_TYPES,
  AUTHORIZATION_FLOW_STATES,
  AUTHORIZATION_FRAMEWORK_EKLS_KINDS,
  createAuthorizationFrameworkModuleContract,
  authorizationFrameworkTools,
  startAuthorization,
  previewAuthorizationCallback,
  submitAuthorizationCredentials,
  validateAuthorizationResult,
  getAuthorizationStatus,
  cancelAuthorization,
  getAuthorizationRequirements,
  resolveProviderAuthorizationRequirements,
  validateAuthorizationFrameworkPillowGovernance,
  validateRequestedScopes,
  validateRequestedPermissions,
  isValidAuthorizationTransition,
  recordAuthorizationFrameworkEklsObservation,
  searchAuthorizationFrameworkEklsObservations,
  registerAuthorizationFrameworkPlugin,
  redactAuthorizationSecrets,
  resetAuthorizationFrameworkHarnessForTests,
} from "./authorization-framework/index.js";

export {
  CREDENTIAL_VAULT_INTEGRATION_VERSION,
  VAULT_CREDENTIAL_TYPES,
  CREDENTIAL_REFERENCE_STATUSES,
  CREDENTIAL_VAULT_EKLS_KINDS,
  createCredentialVaultModuleContract,
  credentialVaultTools,
  createCredentialReference,
  previewCredentialHandoff,
  listCredentialReferences,
  getCredentialReference,
  getCredentialReferenceDetail,
  verifyCredentialReference,
  getCredentialRotationStatus,
  getCredentialHealth,
  runCredentialRedactionTest,
  resolveProviderCredentialRequirements,
  resolveAllProviderCredentialRequirements,
  validateCredentialVaultPillowGovernance,
  recordCredentialVaultEklsObservation,
  searchCredentialVaultEklsObservations,
  listCredentialVaultEklsKinds,
  registerCredentialVaultPlugin,
  listCredentialVaultPlugins,
  handoffSecretToVault,
  verifyVaultReference,
  buildCockpitCredentialStatusView,
  buildCockpitCredentialDetailView,
  redactCredentialVaultSecrets,
  assertNoRawSecretsInPayload,
  resetCredentialVaultHarnessForTests,
} from "./credential-vault-integration/index.js";

export {
  CONNECTION_HEALTH_MONITORING_VERSION,
  CONNECTION_HEALTH_STATES,
  HEALTH_CHECK_TYPES,
  CONNECTION_HEALTH_EKLS_KINDS,
  createConnectionHealthModuleContract,
  connectionHealthTools,
  runConnectionHealthCheck,
  listConnectionHealthChecks,
  getConnectionHealthDetail,
  getConnectionHealthSummary,
  getConnectionHealthAttentionItems,
  getProviderHealthMatrix,
  resolveProviderMonitoringProfile,
  resolveAllProviderMonitoringProfiles,
  validateConnectionHealthPillowGovernance,
  recordConnectionHealthEklsObservation,
  searchConnectionHealthEklsObservations,
  listConnectionHealthEklsKinds,
  registerConnectionHealthPlugin,
  listConnectionHealthPlugins,
  buildCockpitConnectionHealthView,
  buildConnectionHealthNotification,
  redactConnectionHealthSecrets,
  assertNoSecretsInHealthPayload,
  resetConnectionHealthHarnessForTests,
} from "./connection-health-monitoring/index.js";

export {
  AUTHORIZATION_CENTRE_VERSION,
  AUTHORIZATION_CENTRE_SCREEN_ID,
  AUTHORIZATION_CENTRE_ROUTE,
  createAuthorizationCentreModuleContract,
  authorizationCentreTools,
  loadAuthorizationCentreView,
  loadAuthorizationCentreDetailView,
  loadAuthorizationCentreAttentionItems,
  validateAuthorizationCentreAction,
  authorizationCentrePluginRegistry,
  resetAuthorizationCentreHarnessForTests,
} from "./authorization-centre/index.js";

export {
  OPERATIONAL_READINESS_ENGINE_VERSION,
  READINESS_LEVELS,
  READINESS_CONTEXTS,
  READINESS_EKLS_KINDS,
  createOperationalReadinessModuleContract,
  operationalReadinessTools,
  evaluateReadinessOverview,
  evaluateReadinessForWorkspace,
  evaluateReadinessForAccountHolder,
  evaluateReadinessForProvider,
  evaluateReadinessForWorkflow,
  evaluateReadinessForAutomation,
  getReadinessBlockers,
  getReadinessRecommendations,
  resolveReadinessPolicyProfile,
  resolveRequiredProvidersForContext,
  resolveWorkflowIds,
  validateReadinessPillowGovernance,
  recordReadinessEklsObservation,
  searchReadinessEklsObservations,
  listReadinessEklsKinds,
  registerReadinessPlugin,
  listReadinessPlugins,
  buildCockpitReadinessSummary,
  redactReadinessSecrets,
  assertNoSecretsInReadinessPayload,
  resetOperationalReadinessHarnessForTests,
} from "./operational-readiness-engine/index.js";

export {
  AUTOMATIC_REAUTHORIZATION_VERSION,
  TOKEN_LIFECYCLE_STATES,
  TOKEN_LIFECYCLE_EKLS_KINDS,
  createAutomaticReauthorizationModuleContract,
  tokenLifecycleTools,
  getTokenLifecycleSummary,
  getTokenLifecycleDetail,
  listReauthorizationRequired,
  getTokenExpiryWarnings,
  getRefreshEligibility,
  startReauthorization,
  cancelReauthorization,
  getReauthorizationStatus,
  resolveTokenLifecycleProfile,
  detectTokenExpiry,
  validateTokenLifecyclePillowGovernance,
  recordTokenLifecycleEklsObservation,
  searchTokenLifecycleEklsObservations,
  listTokenLifecycleEklsKinds,
  registerTokenLifecyclePlugin,
  listTokenLifecyclePlugins,
  buildCockpitTokenLifecycleView,
  buildTokenLifecycleNotification,
  transitionReauthorizationState,
  redactTokenLifecycleSecrets,
  assertNoSecretsInTokenLifecyclePayload,
  resetAutomaticReauthorizationHarnessForTests,
} from "./automatic-reauthorization/index.js";

export {
  MULTI_WORKSPACE_ISOLATION_VERSION,
  VISIBILITY_SCOPES,
  ACCESS_DECISIONS,
  ISOLATION_EKLS_KINDS,
  createMultiWorkspaceIsolationModuleContract,
  isolationTools,
  wrapG8BrainToolsWithIsolation,
  enforceIsolationBoundary,
  checkIdentityIsolation,
  buildIdentityVisibilityMatrix,
  getAccountHolderConnectionScope,
  getWorkspaceAuthorizationScope,
  getCredentialReferenceVisibility,
  filterCredentialReferences,
  filterAuthorizationRecords,
  filterIsolatedHealthRecords,
  applyCockpitIsolationFilter,
  buildCockpitIsolationSummary,
  validateIsolationPillowGovernance,
  recordIsolationEklsObservation,
  searchIsolationEklsObservations,
  listIsolationEklsKinds,
  registerIsolationPlugin,
  listIsolationPlugins,
  createDelegation,
  revokeDelegation,
  redactIsolationSecrets,
  assertNoSecretsInIsolationPayload,
  resetMultiWorkspaceIsolationHarnessForTests,
} from "./multi-workspace-isolation/index.js";

export {
  IDENTITY_PLUGIN_INTEGRATION_VERSION,
  IDENTITY_PLUGIN_CATEGORIES,
  IDENTITY_PLUGIN_LIFECYCLE_STATES,
  IDENTITY_PLUGIN_EKLS_KINDS,
  type IdentityPluginCategory,
  type IdentityPluginLifecycleState,
  type IdentityPluginManifest,
  type IdentityPluginRecord,
  createIdentityPluginIntegrationModuleContract,
  registerIdentityPlugin,
  enableIdentityPlugin,
  disableIdentityPlugin,
  discoverIdentityPlugins,
  listIdentityPlugins,
  getIdentityPluginDetail,
  listIdentityPluginCapabilities,
  checkIdentityPluginHealth,
  validateIdentityPlugin,
  previewIdentityPluginRegistryPolicy,
  buildIdentityPluginCockpitView,
  recordIdentityPluginEklsObservation,
  searchIdentityPluginEklsObservations,
  listIdentityPluginEklsKinds,
  validateIdentityPluginLifecycleGovernance,
  identityPluginTools,
  redactIdentityPluginSecrets,
  assertNoSecretsInIdentityPluginPayload,
  resetIdentityPluginIntegrationHarnessForTests,
} from "./identity-plugin-integration/index.js";

export {
  IDENTITY_AUTHORIZATION_PROGRAMME_ID,
  IDENTITY_AUTHORIZATION_MISSIONS,
  IDENTITY_AUTHORIZATION_READINESS_RATINGS,
  IDENTITY_AUTHORIZATION_PRODUCTION_CONDITIONS,
  createIdentityAuthorizationProgrammeCertification,
  type IdentityAuthorizationMissionId,
  type IdentityAuthorizationReadinessRating,
  type IdentityAuthorizationProgrammeStatus,
  type IdentityAuthorizationProgrammeCertification,
  type IdentityAuthorizationCertificationArea,
} from "./contract/identity-authorization-programme-certification.js";

export {
  IDENTITY_AUTHORIZATION_PRODUCTION_READINESS_VERSION,
  type IdentityAuthorizationProductionReadinessReport,
  type IdentityAuthorizationSecurityReview,
  type IdentityAuthorizationIntegrationReview,
  type IdentityAuthorizationRiskEntry,
} from "./production-readiness/identity-authorization-production-readiness-types.js";

export { assessIdentityAuthorizationProductionReadiness } from "./production-readiness/identity-authorization-production-readiness-service.js";

export function resetIdentityAuthorizationPlatformHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetIdentityAuthorizationRegistryBatchForTests();
  resetConnectionRegistryHarnessForTests();
  resetAuthorizationFrameworkHarnessForTests();
  resetCredentialVaultHarnessForTests();
  resetConnectionHealthHarnessForTests();
  resetAuthorizationCentreHarnessForTests();
  resetOperationalReadinessHarnessForTests();
  resetAutomaticReauthorizationHarnessForTests();
  resetMultiWorkspaceIsolationHarnessForTests();
  resetIdentityPluginIntegrationHarnessForTests();
  resetIdentityAuthorizationStateForTests();
  resetIdentityAuthorizationObservationStoreForTests();
  resetIdentityAuthorizationPluginHostForTests();
  resetIdentityPlatformHealthRegistrationForTests();
}
