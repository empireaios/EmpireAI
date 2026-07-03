/**
 * EA-003 — EmpireAI RegistryLoader public surface.
 */

export {
  RegistryLoader,
  getRegistryLoader,
  resetRegistryLoaderForTests,
} from "./registry-loader.js";

export {
  REGISTRY_IDS,
  DERIVED_VIEW_IDS,
  REGISTRY_TIERS,
  REGISTRY_TIER_BY_ID,
  FOUNDATION_WIRED_REGISTRY_IDS,
  FOUNDATION_PLACEHOLDER_REGISTRY_IDS,
  REG_DOCTRINE,
  REG_REGION,
  REG_COUNTRY,
  REG_MARKETPLACE,
  REG_SUPPLIER,
  REG_CHANNEL,
  REG_DEPLOYMENT_PROFILE,
  DERIVED_DISCOVERY_SNAPSHOT,
  DERIVED_ACTIVATION_SNAPSHOT,
  DERIVED_READINESS_SNAPSHOT,
  AUTOMATION_REGISTRY_IDS,
  REG_AUTOMATION_TRIGGER,
  REG_AUTOMATION_WORKFLOW,
  REG_AUTOMATION_SCHEDULE,
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_APPROVAL,
  REG_AUTOMATION_EXECUTOR,
  REG_AUTOMATION_RECOVERY,
  REG_AUTOMATION_NOTIFICATION,
  REG_AUTOMATION_REPORT,
  REG_AUTOMATION_MONITOR,
  isRegistryId,
  isDerivedViewId,
  isAutomationRegistryId,
  isCommerceRegistryId,
  isCertificationRegistryId,
  COMMERCE_REGISTRY_IDS,
  CERTIFICATION_REGISTRY_IDS,
  REG_CERTIFICATION_DOMAIN,
  REG_CERTIFICATION_CHECK,
  REG_CERTIFICATION_GATE,
  type CertificationRegistryId,
  REG_STOREFRONT,
  REG_PAYMENT,
  REG_LOGISTICS,
  REG_COUNTRY_COMMERCE,
  REG_PRODUCT_SOURCE,
  REG_COMMERCE_POLICY,
  type CommerceRegistryId,
  type RegistryId,
  type DerivedViewId,
  type AutomationRegistryId,
  type RegistryTier,
} from "./types/registry-ids.js";

export type {
  RegistryLoaderContext,
  RegistryQuery,
  RegistryResolveResult,
  RegistryDerivedResult,
  RegistrySnapshotMeta,
  RegistryLoaderContract,
  RegistryCachePolicy,
  RegistryLifecycleState,
} from "./types/registry-types.js";

export type {
  RegistryPluginManifest,
  RegistryPluginKind,
  RegistryPluginRegistrationResult,
} from "./types/plugin-manifest.js";

export { RegistryCache, defaultRegistryCache } from "./cache/registry-cache.js";
export { RegistryValidationError } from "./validation/registry-validator.js";
export {
  AutomationRegistryValidationError,
  parseAutomationRegistryRow,
  validateAutomationRegistryRows,
  validateAutomationRegistryBatch,
} from "./validation/automation-registry-validator.js";

export {
  AUTOMATION_REGISTRY_VERSION,
  loadAutomationRegistryRows,
  listAutomationRegistryCatalog,
  resetAutomationRegistryBatchForTests,
} from "./sources/automation-source.js";

export {
  AUTOMATION_REGISTRY_LIFECYCLE,
  AUTOMATION_REGISTRY_VERSION as AUTOMATION_SCHEMA_VERSION,
  automationRegistryRowBaseSchema,
  automationTriggerRowSchema,
  automationWorkflowRowSchema,
  automationScheduleRowSchema,
  automationPolicyRowSchema,
  automationApprovalRowSchema,
  automationExecutorRowSchema,
  automationRecoveryRowSchema,
  automationNotificationRowSchema,
  automationReportRowSchema,
  automationMonitorRowSchema,
  type AutomationRegistryRowBase,
  type AutomationTriggerRow,
  type AutomationWorkflowRow,
  type AutomationScheduleRow,
  type AutomationPolicyRow,
  type AutomationApprovalRow,
  type AutomationExecutorRow,
  type AutomationRecoveryRow,
  type AutomationNotificationRow,
  type AutomationReportRow,
  type AutomationMonitorRow,
} from "./types/automation-registry-types.js";

export {
  CommerceRegistryValidationError,
  parseCommerceRegistryRow,
  validateCommerceRegistryRows,
  validateCommerceRegistryBatch,
} from "./validation/commerce-registry-validator.js";

export {
  COMMERCE_REGISTRY_VERSION,
  loadCommerceRegistryRows,
  listCommerceRegistryCatalog,
  resetCommerceRegistryBatchForTests,
} from "./sources/commerce-source.js";

export {
  COMMERCE_REGISTRY_LIFECYCLE,
  COMMERCE_REGISTRY_VERSION as COMMERCE_SCHEMA_VERSION,
  commerceRegistryRowBaseSchema,
  commerceMarketplaceRowSchema,
  commerceSupplierRowSchema,
  commerceStorefrontRowSchema,
  commercePaymentRowSchema,
  commerceLogisticsRowSchema,
  commerceCountryCommerceRowSchema,
  commerceCategoryRowSchema,
  commerceBrandRowSchema,
  commerceProductSourceRowSchema,
  commercePolicyRowSchema,
  COMMERCE_ENGINE_MODULES,
  type CommerceRegistryRowBase,
  type CommerceMarketplaceRow,
  type CommerceSupplierRow,
  type CommerceStorefrontRow,
  type CommercePaymentRow,
  type CommerceLogisticsRow,
  type CommerceCountryCommerceRow,
  type CommerceCategoryRow,
  type CommerceBrandRow,
  type CommerceProductSourceRow,
  type CommercePolicyRow,
  type CommerceEngineModule,
} from "./types/commerce-registry-types.js";

export {
  buildDiscoverySnapshotView,
  buildMarketIntelligenceDiscoveryView,
  mapChannelProfileToIntelligenceSource,
  formatIntelligenceSourceSummary,
  resolveDefaultProductSourceIds,
  type DiscoverySnapshotView,
  type IntelligenceSourceDefinition,
  type IntelligenceSourceStatus,
} from "./derived/discovery-view.js";

export { DEFAULT_DEPLOYMENT_PROFILE_ID } from "./sources/deployment-source.js";

export {
  CertificationRegistryValidationError,
  validateCertificationRegistryRows,
  validateCertificationRegistryBatch,
} from "./validation/certification-registry-validator.js";

export {
  CERTIFICATION_REGISTRY_VERSION,
  loadCertificationRegistryRows,
  resetCertificationRegistryBatchForTests,
} from "./sources/certification-source.js";

export {
  CERTIFICATION_REGISTRY_LIFECYCLE,
  CERTIFICATION_DOMAINS,
  CERTIFICATION_PROBE_REFS,
  certificationDomainConfigurationSchema,
  certificationCheckConfigurationSchema,
  certificationGateConfigurationSchema,
  type CertificationRegistryRowBase,
  type CertificationDomainId,
  type CertificationProbeRef,
} from "./types/certification-registry-types.js";
