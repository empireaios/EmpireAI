/**
 * G2-01 / G2-02 / G2-03 / G2-04 — Infrastructure & Commerce module.
 */

import { resetCommerceRegistryBatchForTests } from "../../registry/sources/commerce-source.js";
import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetMarketplaceIntegrationStateForTests } from "./marketplace/services/marketplace-integration-service.js";
import { resetMarketplacePluginHostForTests } from "./marketplace/plugins/marketplace-plugin-host.js";
import { resetSupplierIntegrationStateForTests } from "./supplier/services/supplier-integration-service.js";
import { resetSupplierPluginHostForTests } from "./supplier/plugins/supplier-plugin-host.js";
import { resetSupplierObservationStoreForTests } from "./supplier/ekls/supplier-observation-store.js";
import { resetStorefrontIntegrationStateForTests } from "./storefront/services/storefront-integration-service.js";
import { resetStorefrontPluginHostForTests } from "./storefront/plugins/storefront-plugin-host.js";
import { resetStorefrontOutcomeStoreForTests } from "./storefront/ekls/storefront-outcome-store.js";
import { resetPaymentIntegrationStateForTests } from "./payment/services/payment-integration-service.js";
import { resetPaymentPluginHostForTests } from "./payment/plugins/payment-plugin-host.js";
import { resetPaymentOutcomeStoreForTests } from "./payment/ekls/payment-outcome-store.js";
import { resetLogisticsIntegrationStateForTests } from "./logistics/services/logistics-integration-service.js";
import { resetLogisticsPluginHostForTests } from "./logistics/plugins/logistics-plugin-host.js";
import { resetLogisticsObservationStoreForTests } from "./logistics/ekls/logistics-observation-store.js";
import { resetAnalyticsIntegrationStateForTests } from "./analytics/services/analytics-integration-service.js";
import { resetAnalyticsPluginHostForTests } from "./analytics/plugins/analytics-plugin-host.js";
import { resetAnalyticsObservationStoreForTests } from "./analytics/ekls/analytics-observation-store.js";
import { resetAnalyticsProviderCatalogForTests } from "./analytics/data/analytics-provider-store.js";
import { resetCommerceOrchestrationIntegrationStateForTests } from "./commerce-orchestration/services/commerce-orchestration-service.js";
import { resetCommerceOrchestrationPluginHostForTests } from "./commerce-orchestration/plugins/commerce-orchestration-plugin-host.js";
import { resetCommerceOrchestrationObservationStoreForTests } from "./commerce-orchestration/ekls/commerce-orchestration-observation-store.js";
import { resetCommerceOrchestrationProfileStoreForTests } from "./commerce-orchestration/data/commerce-orchestration-profile-store.js";
import { resetCommercePluginIntegrationStateForTests } from "./commerce-plugin/services/commerce-plugin-integration-service.js";
import { resetCommercePluginStateForTests } from "./commerce-plugin/state/commerce-plugin-state-manager.js";
import { resetCommercePluginSlotStoreForTests } from "./commerce-plugin/data/commerce-plugin-slot-store.js";
import { resetCommercePluginObservationStoreForTests } from "./commerce-plugin/ekls/commerce-plugin-observation-store.js";
import { resetCommerceOrchestrationStateForTests } from "./commerce-orchestration/state/commerce-orchestration-state-manager.js";

export {
  listCommerceRegistryIds,
  resolveCommerceRegistry,
  resolveAllCommerceRegistries,
  discoverCommerceCapabilitiesForBrain,
} from "./registry/commerce-registry-resolver.js";

export {
  validateCommerceRegistryGovernance,
  type CommerceRegistryGovernanceContext,
  type PillowCommerceRegistryGovernanceResult,
} from "./governance/commerce-registry-pillow-governance.js";

export {
  COMMERCE_BUSINESS_ENGINE_DOMAINS,
  discoverCommerceEngine,
  discoverAllCommerceEngines,
  listCommerceBusinessEngineDomains,
  listCommerceEngineModules,
  type CommerceBusinessEngineDomain,
  type CommerceEngineDiscoverySnapshot,
} from "./services/commerce-engine-discovery-service.js";

export {
  INFRASTRUCTURE_COMMERCE_MODULE_ID,
  INFRASTRUCTURE_COMMERCE_CAPABILITIES,
  createInfrastructureCommerceModuleContract,
  type InfrastructureCommerceCapability,
  type InfrastructureCommerceModuleContract,
} from "./contract/commerce-registry-module.js";

export {
  MARKETPLACE_INTEGRATION_VERSION,
  MARKETPLACE_INTEGRATION_LIFECYCLE,
  MARKETPLACE_API_PROTOCOLS,
  MARKETPLACE_DOMAIN_CAPABILITIES,
  type MarketplaceAdapterContract,
  type MarketplaceDiscoveryResult,
  type MarketplaceCapabilityResolution,
  type MarketplacePluginManifest,
  type MarketplaceBrainCapabilityDescriptor,
  type MarketplaceEngineCapabilityEnvelope,
} from "./marketplace/contracts/marketplace-integration-types.js";

export { listMarketplaceDomainContractKinds } from "./marketplace/contracts/marketplace-domain-contracts.js";

export {
  MarketplaceContractValidationError,
  buildMarketplaceAdapterContract,
  validateMarketplaceAdapterContract,
} from "./marketplace/validation/marketplace-contract-validator.js";

export {
  resolveMarketplaceRegistrySnapshot,
  resolveMarketplaceRowById,
} from "./marketplace/registry/marketplace-registry-resolver.js";

export {
  resolveMarketplaceCapabilities,
  resolveAllMarketplaceCapabilities,
  listSupportedMarketplaceLifecyclePhases,
} from "./marketplace/registry/marketplace-capability-resolver.js";

export {
  canTransitionMarketplaceLifecycle,
  transitionMarketplaceLifecycle,
  listMarketplaceIntegrationLifecyclePhases,
} from "./marketplace/lifecycle/marketplace-integration-lifecycle.js";

export {
  validateMarketplacePillowGovernance,
  validateMarketplacePluginManifestStructure,
  type MarketplacePillowGovernanceContext,
  type MarketplacePillowGovernanceResult,
} from "./marketplace/governance/marketplace-pillow-governance.js";

export {
  getMarketplacePluginHost,
  resetMarketplacePluginHostForTests,
  MarketplacePluginHost,
} from "./marketplace/plugins/marketplace-plugin-host.js";

export {
  discoverMarketplaces,
  validateMarketplaceIntegration,
  getMarketplaceHealthSnapshot,
  advanceMarketplaceLifecycle,
  resetMarketplaceIntegrationStateForTests,
} from "./marketplace/services/marketplace-integration-service.js";

export {
  discoverMarketplaceCapabilitiesForBrain,
  listMarketplaceBrainDomainCapabilities,
} from "./marketplace/services/marketplace-brain-discovery-service.js";

export {
  listMarketplaceEngineBindings,
  provideMarketplaceCapabilityToEngine,
  provideMarketplaceCapabilityToAllEngines,
} from "./marketplace/services/marketplace-engine-bridge-service.js";

export { buildMarketplaceDomainContractBundle } from "./marketplace/services/marketplace-domain-contract-service.js";

export {
  MARKETPLACE_INTEGRATION_ARCHITECTURE_VERSION,
  MARKETPLACE_CONNECTOR_IDS,
  MARKETPLACE_CONNECTOR_CAPABILITIES,
  MARKETPLACE_CONNECTOR_STATUSES,
  MARKETPLACE_FAILURE_KINDS,
  MARKETPLACE_INTEGRATION_PIPELINE as P8_MARKETPLACE_INTEGRATION_PIPELINE,
  MARKETPLACE_SYNC_DOMAINS as P8_MARKETPLACE_SYNC_DOMAINS,
  type MarketplaceConnectorDefinition,
  type MarketplaceConnectorRuntimeSnapshot,
  type MarketplaceFailureRecoveryMapping,
} from "./marketplace/contracts/marketplace-connector-model.js";

export {
  MARKETPLACE_CONNECTOR_CATALOG,
  MARKETPLACE_FAILURE_RECOVERY_MAPPINGS,
} from "./marketplace/data/marketplace-connector-catalog.js";

export {
  MARKETPLACE_COCKPIT_VIEW_ID,
  buildMarketplaceIntegrationArchitectureSnapshot,
  buildMarketplaceCockpitIntegrationView,
  getMarketplaceConnectorDefinition,
  listMarketplaceConnectorDefinitions,
  listMarketplaceIntegrationPipelinePhases,
  listMarketplaceSyncDomains,
  type MarketplaceIntegrationArchitectureSnapshot,
  type MarketplaceCockpitIntegrationView,
} from "./marketplace/services/marketplace-integration-architecture-service.js";

export { registerMarketplaceIntegrationArchitectureRoutes } from "./marketplace/routes/marketplace-integration-architecture-routes.js";

export {
  SUPPLIER_INTEGRATION_VERSION,
  SUPPLIER_INTEGRATION_LIFECYCLE,
  SUPPLIER_API_PROTOCOLS,
  SUPPLIER_DOMAIN_CAPABILITIES,
  SUPPLIER_FULFILMENT_MODES,
  SUPPLIER_EKLS_OBSERVATION_KINDS,
  type SupplierAdapterContract,
  type SupplierDiscoveryResult,
  type SupplierCapabilityResolution,
  type SupplierPluginManifest,
  type SupplierBrainCapabilityDescriptor,
  type SupplierEngineCapabilityEnvelope,
  type SupplierEklsObservationRecord,
  type SupplierEklsObservationKind,
} from "./supplier/contracts/supplier-integration-types.js";

export { listSupplierDomainContractKinds } from "./supplier/contracts/supplier-domain-contracts.js";

export {
  SupplierContractValidationError,
  buildSupplierAdapterContract,
  validateSupplierAdapterContract,
} from "./supplier/validation/supplier-contract-validator.js";

export {
  resolveSupplierRegistrySnapshot,
  resolveSupplierRowById,
} from "./supplier/registry/supplier-registry-resolver.js";

export {
  resolveSupplierCapabilities,
  resolveAllSupplierCapabilities,
  listSupportedSupplierLifecyclePhases,
} from "./supplier/registry/supplier-capability-resolver.js";

export {
  canTransitionSupplierLifecycle,
  transitionSupplierLifecycle,
  listSupplierIntegrationLifecyclePhases,
} from "./supplier/lifecycle/supplier-integration-lifecycle.js";

export {
  validateSupplierPillowGovernance,
  validateSupplierPluginManifestStructure,
  type SupplierPillowGovernanceContext,
  type SupplierPillowGovernanceResult,
} from "./supplier/governance/supplier-pillow-governance.js";

export {
  getSupplierPluginHost,
  resetSupplierPluginHostForTests,
  SupplierPluginHost,
} from "./supplier/plugins/supplier-plugin-host.js";

export {
  discoverSuppliers,
  validateSupplierIntegration,
  getSupplierHealthSnapshot,
  advanceSupplierLifecycle,
  resetSupplierIntegrationStateForTests,
} from "./supplier/services/supplier-integration-service.js";

export {
  discoverSupplierCapabilitiesForBrain,
  listSupplierBrainDomainCapabilities,
} from "./supplier/services/supplier-brain-discovery-service.js";

export {
  listSupplierEngineBindings,
  provideSupplierCapabilityToEngine,
  provideSupplierCapabilityToAllEngines,
} from "./supplier/services/supplier-engine-bridge-service.js";

export { buildSupplierDomainContractBundle } from "./supplier/services/supplier-domain-contract-service.js";

export {
  recordSupplierEklsObservation,
  listSupplierEklsObservations,
  searchSupplierEklsObservations,
} from "./supplier/ekls/supplier-ekls-integration.js";

export { listSupplierEklsObservationKinds } from "./supplier/ekls/supplier-ekls-pillow-governance.js";

export {
  STOREFRONT_INTEGRATION_VERSION,
  STOREFRONT_INTEGRATION_LIFECYCLE,
  STOREFRONT_CHANNEL_MODELS,
  STOREFRONT_DOMAIN_CAPABILITIES,
  STOREFRONT_EKLS_OUTCOME_KINDS,
  type StorefrontAdapterContract,
  type StorefrontDiscoveryResult,
  type StorefrontCapabilityResolution,
  type StorefrontPluginManifest,
  type StorefrontBrainCapabilityDescriptor,
  type StorefrontEngineCapabilityEnvelope,
  type StorefrontEklsOutcomeRecord,
  type StorefrontEklsOutcomeKind,
  type StorefrontProvisioningValidationResult,
} from "./storefront/contracts/storefront-integration-types.js";

export { listStorefrontDomainContractKinds } from "./storefront/contracts/storefront-domain-contracts.js";

export {
  StorefrontContractValidationError,
  buildStorefrontAdapterContract,
  validateStorefrontAdapterContract,
} from "./storefront/validation/storefront-contract-validator.js";

export {
  resolveStorefrontRegistrySnapshot,
  resolveStorefrontRowById,
} from "./storefront/registry/storefront-registry-resolver.js";

export {
  resolveStorefrontCapabilities,
  resolveAllStorefrontCapabilities,
  listSupportedStorefrontLifecyclePhases,
} from "./storefront/registry/storefront-capability-resolver.js";

export {
  canTransitionStorefrontLifecycle,
  transitionStorefrontLifecycle,
  listStorefrontIntegrationLifecyclePhases,
} from "./storefront/lifecycle/storefront-integration-lifecycle.js";

export {
  validateStorefrontPillowGovernance,
  validateStorefrontPluginManifestStructure,
  type StorefrontPillowGovernanceContext,
  type StorefrontPillowGovernanceResult,
} from "./storefront/governance/storefront-pillow-governance.js";

export {
  getStorefrontPluginHost,
  resetStorefrontPluginHostForTests,
  StorefrontPluginHost,
} from "./storefront/plugins/storefront-plugin-host.js";

export {
  discoverStorefronts,
  validateStorefrontIntegration,
  validateStorefrontProvisioning,
  getStorefrontHealthSnapshot,
  advanceStorefrontLifecycle,
  resetStorefrontIntegrationStateForTests,
} from "./storefront/services/storefront-integration-service.js";

export {
  discoverStorefrontCapabilitiesForBrain,
  listStorefrontBrainDomainCapabilities,
} from "./storefront/services/storefront-brain-discovery-service.js";

export {
  listStorefrontEngineBindings,
  provideStorefrontCapabilityToEngine,
  provideStorefrontCapabilityToAllEngines,
} from "./storefront/services/storefront-engine-bridge-service.js";

export { buildStorefrontDomainContractBundle } from "./storefront/services/storefront-domain-contract-service.js";

export {
  recordStorefrontEklsOutcome,
  listStorefrontEklsOutcomes,
  searchStorefrontEklsOutcomes,
} from "./storefront/ekls/storefront-ekls-integration.js";

export { listStorefrontEklsOutcomeKinds } from "./storefront/ekls/storefront-ekls-pillow-governance.js";

export {
  PAYMENT_INTEGRATION_VERSION,
  PAYMENT_INTEGRATION_LIFECYCLE,
  PAYMENT_AUTHENTICATION_METHODS,
  PAYMENT_METHOD_KINDS,
  PAYMENT_DOMAIN_CAPABILITIES,
  PAYMENT_SECURITY_FEATURES,
  PAYMENT_EKLS_OUTCOME_KINDS,
  type PaymentAdapterContract,
  type PaymentDiscoveryResult,
  type PaymentCapabilityResolution,
  type PaymentPluginManifest,
  type PaymentBrainCapabilityDescriptor,
  type PaymentEngineCapabilityEnvelope,
  type PaymentEklsOutcomeRecord,
  type PaymentEklsOutcomeKind,
  type PaymentSecurityValidationResult,
} from "./payment/contracts/payment-integration-types.js";

export { listPaymentDomainContractKinds } from "./payment/contracts/payment-domain-contracts.js";

export {
  PaymentContractValidationError,
  buildPaymentAdapterContract,
  validatePaymentAdapterContract,
} from "./payment/validation/payment-contract-validator.js";

export {
  validatePaymentSecurityProfile,
  assertNoSensitivePaymentPayload,
} from "./payment/validation/payment-security-validator.js";

export {
  resolvePaymentRegistrySnapshot,
  resolvePaymentRowById,
  resolveCurrenciesForPayment,
} from "./payment/registry/payment-registry-resolver.js";

export {
  resolvePaymentCapabilities,
  resolveAllPaymentCapabilities,
  listSupportedPaymentLifecyclePhases,
} from "./payment/registry/payment-capability-resolver.js";

export {
  canTransitionPaymentLifecycle,
  transitionPaymentLifecycle,
  listPaymentIntegrationLifecyclePhases,
} from "./payment/lifecycle/payment-integration-lifecycle.js";

export {
  validatePaymentPillowGovernance,
  validatePaymentPluginManifestStructure,
  type PaymentPillowGovernanceContext,
  type PaymentPillowGovernanceResult,
} from "./payment/governance/payment-pillow-governance.js";

export {
  getPaymentPluginHost,
  resetPaymentPluginHostForTests,
  PaymentPluginHost,
} from "./payment/plugins/payment-plugin-host.js";

export {
  discoverPayments,
  validatePaymentIntegration,
  getPaymentHealthSnapshot,
  advancePaymentLifecycle,
  resetPaymentIntegrationStateForTests,
} from "./payment/services/payment-integration-service.js";

export {
  discoverPaymentCapabilitiesForBrain,
  listPaymentBrainDomainCapabilities,
} from "./payment/services/payment-brain-discovery-service.js";

export {
  listPaymentEngineBindings,
  listPaymentConsumerBindings,
  providePaymentCapabilityToEngine,
  providePaymentCapabilityToConsumer,
  providePaymentCapabilityToAllConsumers,
} from "./payment/services/payment-engine-bridge-service.js";

export { buildPaymentDomainContractBundle } from "./payment/services/payment-domain-contract-service.js";

export {
  recordPaymentEklsOutcome,
  listPaymentEklsOutcomes,
  searchPaymentEklsOutcomes,
} from "./payment/ekls/payment-ekls-integration.js";

export { listPaymentEklsOutcomeKinds } from "./payment/ekls/payment-ekls-pillow-governance.js";

export {
  LOGISTICS_INTEGRATION_VERSION,
  LOGISTICS_SHIPMENT_LIFECYCLE,
  LOGISTICS_AUTHENTICATION_METHODS,
  LOGISTICS_PROVIDER_KINDS,
  LOGISTICS_DOMAIN_CAPABILITIES,
  LOGISTICS_EKLS_OBSERVATION_KINDS,
  type LogisticsAdapterContract,
  type LogisticsDiscoveryResult,
  type LogisticsCapabilityResolution,
  type LogisticsPluginManifest,
  type LogisticsBrainCapabilityDescriptor,
  type LogisticsEngineCapabilityEnvelope,
  type LogisticsEklsObservationRecord,
  type LogisticsEklsObservationKind,
} from "./logistics/contracts/logistics-integration-types.js";

export { listLogisticsDomainContractKinds } from "./logistics/contracts/logistics-domain-contracts.js";

export {
  LogisticsContractValidationError,
  buildLogisticsAdapterContract,
  validateLogisticsAdapterContract,
} from "./logistics/validation/logistics-contract-validator.js";

export {
  resolveLogisticsRegistrySnapshot,
  resolveLogisticsRowById,
  resolveRegionsForLogistics,
} from "./logistics/registry/logistics-registry-resolver.js";

export {
  resolveLogisticsCapabilities,
  resolveAllLogisticsCapabilities,
  listSupportedLogisticsLifecyclePhases,
} from "./logistics/registry/logistics-capability-resolver.js";

export {
  canTransitionLogisticsLifecycle,
  transitionLogisticsLifecycle,
  listLogisticsShipmentLifecyclePhases,
} from "./logistics/lifecycle/logistics-integration-lifecycle.js";

export {
  validateLogisticsPillowGovernance,
  validateLogisticsPluginManifestStructure,
  type LogisticsPillowGovernanceContext,
  type LogisticsPillowGovernanceResult,
} from "./logistics/governance/logistics-pillow-governance.js";

export {
  getLogisticsPluginHost,
  resetLogisticsPluginHostForTests,
  LogisticsPluginHost,
} from "./logistics/plugins/logistics-plugin-host.js";

export {
  discoverLogisticsProviders,
  validateLogisticsIntegration,
  getLogisticsHealthSnapshot,
  advanceLogisticsLifecycle,
  resetLogisticsIntegrationStateForTests,
} from "./logistics/services/logistics-integration-service.js";

export {
  discoverLogisticsCapabilitiesForBrain,
  listLogisticsBrainDomainCapabilities,
} from "./logistics/services/logistics-brain-discovery-service.js";

export {
  listLogisticsEngineBindings,
  listLogisticsConsumerBindings,
  provideLogisticsCapabilityToEngine,
  provideLogisticsCapabilityToConsumer,
  provideLogisticsCapabilityToAllConsumers,
} from "./logistics/services/logistics-engine-bridge-service.js";

export { buildLogisticsDomainContractBundle } from "./logistics/services/logistics-domain-contract-service.js";

export {
  recordLogisticsEklsObservation,
  listLogisticsEklsObservations,
  searchLogisticsEklsObservations,
} from "./logistics/ekls/logistics-ekls-integration.js";

export { listLogisticsEklsObservationKinds } from "./logistics/ekls/logistics-ekls-pillow-governance.js";

export {
  ANALYTICS_INTEGRATION_VERSION,
  ANALYTICS_METRIC_LIFECYCLE,
  ANALYTICS_CATEGORIES,
  ANALYTICS_AGGREGATION_MODES,
  ANALYTICS_DOMAIN_CAPABILITIES,
  ANALYTICS_EKLS_OBSERVATION_KINDS,
  EXECUTIVE_AI_CONSUMERS,
  type AnalyticsAdapterContract,
  type AnalyticsDiscoveryResult,
  type AnalyticsCapabilityResolution,
  type AnalyticsPluginManifest,
  type AnalyticsBrainCapabilityDescriptor,
  type AnalyticsExecutiveAiInputEnvelope,
  type AnalyticsEngineEventEnvelope,
  type AnalyticsEklsObservationRecord,
  type AnalyticsEklsObservationKind,
  type AnalyticsMetricValidationResult,
} from "./analytics/contracts/analytics-integration-types.js";

export { listAnalyticsDomainContractKinds } from "./analytics/contracts/analytics-domain-contracts.js";

export {
  AnalyticsContractValidationError,
  buildAnalyticsAdapterContract,
  validateAnalyticsAdapterContract,
} from "./analytics/validation/analytics-contract-validator.js";

export {
  validateAnalyticsMetricRef,
  validateAnalyticsEventRef,
} from "./analytics/validation/analytics-metric-validator.js";

export {
  resolveAnalyticsRegistrySnapshot,
  resolvePolicyForAnalytics,
  resolveRetentionPolicyForAnalytics,
} from "./analytics/registry/analytics-registry-resolver.js";

export {
  resolveAnalyticsCapabilities,
  resolveAllAnalyticsCapabilities,
  listSupportedAnalyticsLifecyclePhases,
} from "./analytics/registry/analytics-capability-resolver.js";

export {
  canTransitionAnalyticsLifecycle,
  transitionAnalyticsLifecycle,
  listAnalyticsMetricLifecyclePhases,
} from "./analytics/lifecycle/analytics-metric-lifecycle.js";

export {
  validateAnalyticsPillowGovernance,
  validateAnalyticsPluginManifestStructure,
  type AnalyticsPillowGovernanceContext,
  type AnalyticsPillowGovernanceResult,
} from "./analytics/governance/analytics-pillow-governance.js";

export {
  getAnalyticsPluginHost,
  resetAnalyticsPluginHostForTests,
  AnalyticsPluginHost,
} from "./analytics/plugins/analytics-plugin-host.js";

export {
  discoverAnalyticsProviders,
  validateAnalyticsIntegration,
  getAnalyticsHealthSnapshot,
  advanceAnalyticsLifecycle,
  resetAnalyticsIntegrationStateForTests,
} from "./analytics/services/analytics-integration-service.js";

export {
  discoverAnalyticsCapabilitiesForBrain,
  listAnalyticsBrainDomainCapabilities,
} from "./analytics/services/analytics-brain-discovery-service.js";

export {
  listExecutiveAiConsumers,
  provideAnalyticsInputToExecutiveAi,
  provideAnalyticsInputToAllExecutiveAiConsumers,
} from "./analytics/services/analytics-executive-ai-bridge-service.js";

export {
  listAnalyticsEventSourceEngines,
  listAnalyticsEventSourceConsumers,
  receiveOperationalEventFromEngine,
  receiveOperationalEventsFromAllEngines,
} from "./analytics/services/analytics-engine-event-bridge-service.js";

export { buildAnalyticsDomainContractBundle } from "./analytics/services/analytics-domain-contract-service.js";

export {
  recordAnalyticsEklsObservation,
  listAnalyticsEklsObservations,
  searchAnalyticsEklsObservations,
} from "./analytics/ekls/analytics-ekls-integration.js";

export { listAnalyticsEklsObservationKinds } from "./analytics/ekls/analytics-ekls-pillow-governance.js";

export {
  COMMERCE_ORCHESTRATION_VERSION,
  COMMERCE_ORCHESTRATION_LIFECYCLE,
  COMMERCE_PARTICIPATING_COMPONENTS,
  COMMERCE_COORDINATION_CAPABILITIES,
  COMMERCE_EXECUTION_SCOPES,
  COMMERCE_ORCHESTRATION_EKLS_OBSERVATION_KINDS,
  COMMERCE_ORCHESTRATION_PLUGIN_ROLES,
  EXECUTIVE_AI_STATE_CONSUMERS,
  type CommerceOrchestrationContract,
  type CommerceOrchestrationDiscoveryResult,
  type CommerceCoordinationResolution,
  type CommerceOrchestrationRequest,
  type CommerceOrchestrationPluginManifest,
  type CommerceBrainOrchestrationDescriptor,
  type CommerceEngineCoordinationEnvelope,
  type CommerceExecutiveAiStateEnvelope,
  type CommerceOrchestrationStateSnapshot,
  type CommerceOrchestrationEklsObservationRecord,
  type CommerceOrchestrationEklsObservationKind,
} from "./commerce-orchestration/contracts/commerce-orchestration-types.js";

export { listCommerceOrchestrationDomainKinds } from "./commerce-orchestration/contracts/commerce-orchestration-domain-contracts.js";

export {
  CommerceOrchestrationValidationError,
  buildCommerceOrchestrationContract,
  validateCommerceOrchestrationRequest,
} from "./commerce-orchestration/validation/commerce-orchestration-contract-validator.js";

export {
  resolveCommerceOrchestrationRegistrySnapshot,
  verifyOrchestrationRegistryRefs,
} from "./commerce-orchestration/registry/commerce-orchestration-registry-resolver.js";

export {
  resolveCommerceCoordinationCapabilities,
  resolveAllCommerceCoordinationCapabilities,
  listSupportedCommerceOrchestrationLifecyclePhases,
} from "./commerce-orchestration/registry/commerce-orchestration-capability-resolver.js";

export {
  canTransitionCommerceOrchestrationLifecycle,
  transitionCommerceOrchestrationLifecycle,
  listCommerceOrchestrationLifecyclePhases,
} from "./commerce-orchestration/lifecycle/commerce-orchestration-lifecycle.js";

export {
  validateCommerceOrchestrationPillowGovernance,
  validateCommerceOrchestrationPluginManifest,
  validateOrchestrationRequestGovernance,
  type CommerceOrchestrationPillowContext,
  type CommerceOrchestrationPillowResult,
} from "./commerce-orchestration/governance/commerce-orchestration-pillow-governance.js";

export {
  getCommerceOrchestrationPluginHost,
  resetCommerceOrchestrationPluginHostForTests,
  CommerceOrchestrationPluginHost,
} from "./commerce-orchestration/plugins/commerce-orchestration-plugin-host.js";

export {
  discoverCommerceOrchestrationProfiles,
  validateCommerceOrchestrationProfile,
  prepareCommerceOrchestration,
  getCommerceOrchestrationHealthSnapshot,
  advanceCommerceOrchestrationLifecycle,
  resetCommerceOrchestrationIntegrationStateForTests,
} from "./commerce-orchestration/services/commerce-orchestration-service.js";

export {
  discoverCommerceOrchestrationForBrain,
  listCommerceBrainCoordinationCapabilities,
} from "./commerce-orchestration/services/commerce-orchestration-brain-bridge-service.js";

export {
  listCoordinatedCommerceEngines,
  coordinateCommerceEngines,
  coordinateAllCommerceProfiles,
  coordinateAdvertisingEngine,
} from "./commerce-orchestration/services/commerce-orchestration-engine-coordinator-service.js";

export {
  listExecutiveAiStateConsumers,
  exposeOperationalStateToExecutiveAi,
  exposeOperationalStateToAllExecutiveAiConsumers,
} from "./commerce-orchestration/services/commerce-orchestration-executive-ai-bridge-service.js";

export { buildCommerceOrchestrationDomainContractBundle } from "./commerce-orchestration/services/commerce-orchestration-domain-contract-service.js";

export {
  getOrchestrationStateSnapshot,
  resetCommerceOrchestrationStateForTests,
} from "./commerce-orchestration/state/commerce-orchestration-state-manager.js";

export {
  recordCommerceOrchestrationEklsObservation,
  searchCommerceOrchestrationEklsObservations,
} from "./commerce-orchestration/ekls/commerce-orchestration-ekls-integration.js";

export { listCommerceOrchestrationEklsObservationKinds } from "./commerce-orchestration/ekls/commerce-orchestration-ekls-pillow-governance.js";

export {
  COMMERCE_PLUGIN_INTEGRATION_VERSION,
  COMMERCE_PLUGIN_LIFECYCLE,
  COMMERCE_PLUGIN_CATEGORIES,
  COMMERCE_PLUGIN_KINDS,
  COMMERCE_PLUGIN_EKLS_OBSERVATION_KINDS,
  COMMERCE_PLUGIN_CATEGORY_TO_KIND,
  type CommercePluginAdapterContract,
  type CommercePluginDiscoveryResult,
  type CommercePluginCapabilityResolution,
  type CommercePluginRegistrationManifest,
  type CommercePluginBrainCapabilityDescriptor,
  type CommercePluginEngineExtensionEnvelope,
  type CommercePluginEklsObservationRecord,
  type CommercePluginEklsObservationKind,
  type CommercePluginLifecycleTransitionResult,
  type CommercePluginCompatibilityResult,
} from "./commerce-plugin/contracts/commerce-plugin-integration-types.js";

export { listCommercePluginDomainContractKinds } from "./commerce-plugin/contracts/commerce-plugin-domain-contracts.js";

export {
  CommercePluginValidationError,
  buildCommercePluginAdapterContract,
  validateCommercePluginRegistrationManifest,
} from "./commerce-plugin/validation/commerce-plugin-contract-validator.js";

export { validateCommercePluginCompatibility } from "./commerce-plugin/validation/commerce-plugin-compatibility-validator.js";

export {
  resolveCommercePluginRegistrySnapshot,
  verifyPluginSlotRegistryRef,
} from "./commerce-plugin/registry/commerce-plugin-registry-resolver.js";

export {
  resolveCommercePluginCapabilities,
  resolveAllCommercePluginCapabilities,
  listSupportedCommercePluginLifecyclePhases,
} from "./commerce-plugin/registry/commerce-plugin-capability-resolver.js";

export {
  canTransitionCommercePluginLifecycle,
  transitionCommercePluginLifecycle,
  listCommercePluginLifecyclePhases,
} from "./commerce-plugin/lifecycle/commerce-plugin-lifecycle.js";

export {
  validateCommercePluginPillowGovernance,
  validateCommercePluginRegistrationManifestGovernance,
  validateCommercePluginManifestForRegistration,
  type CommercePluginPillowContext,
  type CommercePluginPillowResult,
} from "./commerce-plugin/governance/commerce-plugin-pillow-governance.js";

export {
  COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
  registerCommercePluginThroughFramework,
  listCommercePluginsFromFramework,
  isCommercePluginKind,
} from "./commerce-plugin/framework/commerce-plugin-framework-bridge.js";

export {
  discoverCommercePluginSlots,
  validateCommercePluginSlot,
  registerCommercePlugin,
  getCommercePluginHealthSnapshot,
  advanceCommercePluginLifecycle,
  getCommercePluginRecordById,
  listCommercePluginRecords,
  resetCommercePluginIntegrationStateForTests,
} from "./commerce-plugin/services/commerce-plugin-integration-service.js";

export {
  discoverCommercePluginCapabilitiesForBrain,
  listCommercePluginBrainCategories,
  dispatchValidatedCommercePluginCapability,
} from "./commerce-plugin/services/commerce-plugin-brain-discovery-service.js";

export {
  listCommercePluginEngineBindings,
  provideCommercePluginExtensionsToEngine,
  provideCommercePluginExtensionsToAllEngines,
  provideAdvertisingEnginePluginExtension,
} from "./commerce-plugin/services/commerce-plugin-engine-bridge-service.js";

export {
  recordCommercePluginEklsObservation,
  searchCommercePluginEklsObservations,
} from "./commerce-plugin/ekls/commerce-plugin-ekls-integration.js";

export { listCommercePluginEklsObservationKinds } from "./commerce-plugin/ekls/commerce-plugin-ekls-pillow-governance.js";

export function resetInfrastructureCommerceForTests(): void {
  resetCommerceRegistryBatchForTests();
  resetRegistryLoaderForTests();
  resetMarketplaceIntegrationStateForTests();
  resetMarketplacePluginHostForTests();
  resetSupplierIntegrationStateForTests();
  resetSupplierPluginHostForTests();
  resetSupplierObservationStoreForTests();
  resetStorefrontIntegrationStateForTests();
  resetStorefrontPluginHostForTests();
  resetStorefrontOutcomeStoreForTests();
  resetPaymentIntegrationStateForTests();
  resetPaymentPluginHostForTests();
  resetPaymentOutcomeStoreForTests();
  resetLogisticsIntegrationStateForTests();
  resetLogisticsPluginHostForTests();
  resetLogisticsObservationStoreForTests();
  resetAnalyticsIntegrationStateForTests();
  resetAnalyticsPluginHostForTests();
  resetAnalyticsObservationStoreForTests();
  resetAnalyticsProviderCatalogForTests();
  resetCommerceOrchestrationIntegrationStateForTests();
  resetCommerceOrchestrationPluginHostForTests();
  resetCommerceOrchestrationObservationStoreForTests();
  resetCommerceOrchestrationProfileStoreForTests();
  resetCommerceOrchestrationStateForTests();
  resetCommercePluginIntegrationStateForTests();
  resetCommercePluginStateForTests();
  resetCommercePluginSlotStoreForTests();
  resetCommercePluginObservationStoreForTests();
}
