export {
  REALITY_PROVIDER_CATEGORIES,
  CONNECTOR_LIFECYCLE_STATES,
  CONNECTOR_HEALTH_STATES,
  CREDENTIAL_TYPES,
  AUTHENTICATION_METHODS,
  realityProviderDefinitionSchema,
  connectorRuntimeStateSchema,
  credentialVaultRecordSchema,
  connectorHealthCenterSchema,
  realityIntegrationDashboardSchema,
  realityIntegrationValidationSchema,
} from "./models/reality-integration.js";

export {
  CONNECTION_LIFECYCLE_STATES as REAL002_LIFECYCLE_STATES,
  CONNECTION_LIFECYCLE_TRANSITIONS,
  isTerminalLifecycleState,
  isOperationalLifecycleState,
  mapLifecycleToHealthState,
} from "./models/connection-lifecycle.js";

export type {
  ConnectionLifecycleState,
  ConnectionLifecycleTransition,
} from "./models/connection-lifecycle.js";

export type {
  ProviderCapabilityMatrix,
  ProviderCapabilityMatrixEntry,
} from "./models/provider-capability-matrix.js";

export type {
  ApprovalPolicy,
  ApprovalAssessment,
  IrreversibleAction,
} from "./models/approval-framework.js";
export { IRREVERSIBLE_ACTIONS, APPROVAL_POLICIES } from "./models/approval-framework.js";

export type {
  CredentialGovernanceRecord,
  CredentialGovernanceSummary,
  CredentialVerificationResult,
} from "./models/credential-governance.js";

export type { RealityReadinessDashboard } from "./models/reality-readiness-dashboard.js";

export type {
  RealityProviderCategory,
  RealityProviderDefinition,
  ConnectorRuntimeState,
  CredentialVaultRecord,
  ConnectorHealthCenter,
  RealityIntegrationDashboard,
  RealityIntegrationValidation,
} from "./models/reality-integration.js";

export {
  REALITY_PROVIDER_CATALOG,
  getRealityProvider,
  listRealityProviders,
} from "./models/provider-catalog.js";

export {
  REALITY_INTEGRATION_MODULE_ID,
  REALITY_INTEGRATION_CAPABILITIES,
  createRealityIntegrationModuleContract,
} from "./contract/reality-integration-module.js";

export {
  getCredentialVaultRepository,
  resetCredentialVaultRepository,
  storeConnectorCredential,
  CredentialVaultError,
} from "./repositories/sqlite-credential-vault-repository.js";

export {
  getConnectorMonitoringRepository,
  resetConnectorMonitoringRepository,
} from "./repositories/sqlite-connector-monitoring-repository.js";

export {
  ConnectorRuntimeError,
  ConnectorRuntimeNotFoundError,
  connectorConnect,
  connectorDisconnect,
  connectorValidate,
  connectorHeartbeat,
  connectorRefresh,
  connectorHealth,
  connectorCost,
  connectorDependencies,
  getConnectorRuntimeState,
  listConnectorRuntimeStates,
  resetConnectorRuntimeStates,
} from "./services/connector-runtime.js";

export {
  assessConnectorGovernance,
  connectorGovernanceFlow,
} from "./services/connector-governance-service.js";

export {
  listConnectorRegistry,
  getConnectorRegistryEntry,
  connectProvider,
  disconnectProvider,
  buildConnectorHealthCenter,
  buildRealityIntegrationDashboard,
  validateRealityIntegration,
} from "./services/reality-integration-service.js";

export { buildProviderCapabilityMatrix, getProviderCapabilityMatrixEntry, listProvidersByAuthMethod } from "./services/provider-capability-matrix-service.js";
export { getApprovalPolicy, listApprovalPolicies, assessApprovalRequired, buildApprovalQueueSummary } from "./services/approval-framework-service.js";
export { recordCredentialGovernanceEvent, verifyCredential, buildCredentialGovernanceSummary, listExpiringCredentials, resetCredentialGovernanceAudit } from "./services/credential-governance-service.js";
export { buildRealityReadinessDashboard, buildEsisRealityReadinessPayload } from "./services/reality-readiness-dashboard-service.js";

export {
  LIVE_COMMERCE_LIFECYCLE_STATES,
  LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS,
  PROVIDER_OPERATIONAL_CAPABILITIES,
  mapToLiveCommerceLifecycle,
  isLiveCommerceOperationalState,
} from "./models/live-commerce-foundation.js";

export type {
  LiveCommerceLifecycleState,
  LiveCommerceMarketplaceProviderId,
  ProviderOperationalCapability,
  ProviderCapabilityVerification,
  RuntimeActivationAssessment,
  LiveCommerceFoundationDashboard,
} from "./models/live-commerce-foundation.js";

export type {
  OperationalAccessRecord,
  OperationalAccessRegistry,
} from "./models/operational-access-registry.js";

export type { CredentialVaultProfile } from "./models/credential-vault-profile.js";

export {
  verifyProviderCapabilities,
  verifyLiveCommerceMarketplaceCapabilities,
} from "./services/provider-capability-verification-service.js";

export {
  assessRuntimeActivation,
  listRuntimeActivationAssessments,
} from "./services/runtime-activation-service.js";

export {
  buildCredentialVaultProfile,
  listCredentialVaultProfiles,
} from "./services/credential-vault-profile-service.js";

export {
  buildOperationalAccessRegistry,
  getOperationalAccessRecord,
  resetOperationalAccessRegistry,
} from "./services/operational-access-registry-service.js";

export {
  buildLiveCommerceFoundationDashboard,
  buildEsisLiveCommercePayload,
  buildExecutiveLiveCommerceSnapshot,
} from "./services/live-commerce-foundation-service.js";

export {
  buildLiveCommerceIntegrationDashboard,
  validateLiveMarketplaceConnection,
  runLiveCommerceSync,
  processLiveCommerceWebhook,
  recoverFailedLiveCommerceOperation,
  runLiveCommerceSecurityReview,
  assessLiveCommerceGoLive,
  connectLiveCommerceProvider,
  recordLiveCommerceAudit,
  isLiveCommerceProvider,
} from "./live-commerce/services/live-commerce-integration-service.js";

export {
  startMarketplaceOAuth,
  completeMarketplaceOAuth,
  refreshMarketplaceOAuthTokens,
  authenticateSupplierProvider,
} from "./live-commerce/services/oauth-lifecycle-service.js";

export {
  isLiveCommerceIntegrationEnabled,
  resolveLiveCommerceIntegrationMode,
} from "./live-commerce/config.js";

export { resetLiveCommerceRepository } from "./live-commerce/repositories/sqlite-live-commerce-repository.js";
export { resetHttpTransportOverride } from "./live-commerce/http-transport.js";

export { realityIntegrationTools } from "./tools/reality-integration-tools.js";
export { registerRealityIntegrationRoutes } from "./routes/reality-integration-routes.js";
