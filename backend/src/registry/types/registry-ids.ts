/**
 * EA-003 — Canonical registry identifiers (EA-002 hierarchy).
 */

export const REGISTRY_TIERS = [
  "constitutional",
  "platform_catalog",
  "deployment",
  "policy_topology",
  "workspace",
  "derived",
] as const;

export type RegistryTier = (typeof REGISTRY_TIERS)[number];

/** Tier 0 — Constitutional */
export const REG_DOCTRINE = "REG-DOCTRINE" as const;
export const REG_BUSINESS_RULE = "REG-BUSINESS-RULE" as const;

/** Tier 1 — Platform catalog */
export const REG_REGION = "REG-REGION" as const;
export const REG_COUNTRY = "REG-COUNTRY" as const;
export const REG_MARKETPLACE = "REG-MARKETPLACE" as const;
export const REG_SUPPLIER = "REG-SUPPLIER" as const;

/** Tier 2 — Deployment */
export const REG_PROVIDER = "REG-PROVIDER" as const;
export const REG_INTEGRATION = "REG-INTEGRATION" as const;
export const REG_CHANNEL = "REG-CHANNEL" as const;
export const REG_DEPLOYMENT_PROFILE = "REG-DEPLOYMENT-PROFILE" as const;

/** Tier 3 — Policy & topology */
export const REG_SCORING_POLICY = "REG-SCORING-POLICY" as const;
export const REG_PRICING_POLICY = "REG-PRICING-POLICY" as const;
export const REG_AI_ENGINE = "REG-AI-ENGINE" as const;
export const REG_WORKFLOW = "REG-WORKFLOW" as const;

/** Tier 4 — Workspace */
export const REG_TENANT = "REG-TENANT" as const;
export const REG_COMPANY = "REG-COMPANY" as const;
export const REG_BRAND = "REG-BRAND" as const;
export const REG_CATEGORY = "REG-CATEGORY" as const;
export const REG_PRODUCT = "REG-PRODUCT" as const;

/** Tier 3 — Business Automation (G5-01, Pillow-governed) */
export const REG_AUTOMATION_TRIGGER = "REG-AUTOMATION-TRIGGER" as const;
export const REG_AUTOMATION_WORKFLOW = "REG-AUTOMATION-WORKFLOW" as const;
export const REG_AUTOMATION_SCHEDULE = "REG-AUTOMATION-SCHEDULE" as const;
export const REG_AUTOMATION_POLICY = "REG-AUTOMATION-POLICY" as const;
export const REG_AUTOMATION_APPROVAL = "REG-AUTOMATION-APPROVAL" as const;
export const REG_AUTOMATION_EXECUTOR = "REG-AUTOMATION-EXECUTOR" as const;
export const REG_AUTOMATION_RECOVERY = "REG-AUTOMATION-RECOVERY" as const;
export const REG_AUTOMATION_NOTIFICATION = "REG-AUTOMATION-NOTIFICATION" as const;
export const REG_AUTOMATION_REPORT = "REG-AUTOMATION-REPORT" as const;
export const REG_AUTOMATION_MONITOR = "REG-AUTOMATION-MONITOR" as const;

export const AUTOMATION_REGISTRY_IDS = [
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
] as const;

export type AutomationRegistryId = (typeof AUTOMATION_REGISTRY_IDS)[number];

/** Tier 1 / 2 / 3 / 4 — G2 Commerce programme (G2-01, Pillow-governed) */
export const REG_STOREFRONT = "REG-STOREFRONT" as const;
export const REG_PAYMENT = "REG-PAYMENT" as const;
export const REG_LOGISTICS = "REG-LOGISTICS" as const;
export const REG_COUNTRY_COMMERCE = "REG-COUNTRY-COMMERCE" as const;
export const REG_PRODUCT_SOURCE = "REG-PRODUCT-SOURCE" as const;
export const REG_COMMERCE_POLICY = "REG-COMMERCE-POLICY" as const;

/** Tier 3 — Production Certification (G6-00, Pillow-governed) */
export const REG_CERTIFICATION_DOMAIN = "REG-CERTIFICATION-DOMAIN" as const;
export const REG_CERTIFICATION_CHECK = "REG-CERTIFICATION-CHECK" as const;
export const REG_CERTIFICATION_GATE = "REG-CERTIFICATION-GATE" as const;
export const REG_CERTIFICATION_INTEGRITY = "REG-CERTIFICATION-INTEGRITY" as const;
export const REG_CERTIFICATION_SECURITY = "REG-CERTIFICATION-SECURITY" as const;
export const REG_CERTIFICATION_DEPLOYMENT = "REG-CERTIFICATION-DEPLOYMENT" as const;
export const REG_CERTIFICATION_OPERATIONAL = "REG-CERTIFICATION-OPERATIONAL" as const;
export const REG_CERTIFICATION_BUSINESS = "REG-CERTIFICATION-BUSINESS" as const;
export const REG_CERTIFICATION_PERFORMANCE = "REG-CERTIFICATION-PERFORMANCE" as const;
export const REG_CERTIFICATION_EXECUTIVE = "REG-CERTIFICATION-EXECUTIVE" as const;
export const REG_CERTIFICATION_FAILURE_RECOVERY = "REG-CERTIFICATION-FAILURE-RECOVERY" as const;
export const REG_CERTIFICATION_SIMULATION = "REG-CERTIFICATION-SIMULATION" as const;
export const REG_CERTIFICATION_FINAL_READINESS = "REG-CERTIFICATION-FINAL-READINESS" as const;

export const CERTIFICATION_REGISTRY_IDS = [
  REG_CERTIFICATION_DOMAIN,
  REG_CERTIFICATION_CHECK,
  REG_CERTIFICATION_GATE,
  REG_CERTIFICATION_INTEGRITY,
  REG_CERTIFICATION_SECURITY,
  REG_CERTIFICATION_DEPLOYMENT,
  REG_CERTIFICATION_OPERATIONAL,
  REG_CERTIFICATION_BUSINESS,
  REG_CERTIFICATION_PERFORMANCE,
  REG_CERTIFICATION_EXECUTIVE,
  REG_CERTIFICATION_FAILURE_RECOVERY,
  REG_CERTIFICATION_SIMULATION,
  REG_CERTIFICATION_FINAL_READINESS,
] as const;

export type CertificationRegistryId = (typeof CERTIFICATION_REGISTRY_IDS)[number];

/** Tier 3 — Grand King Live Operations (G7-00, Pillow-governed) */
export const REG_LIVE_OPERATIONS_DOMAIN = "REG-LIVE-OPERATIONS-DOMAIN" as const;
export const REG_LIVE_OPERATIONS_PROFILE = "REG-LIVE-OPERATIONS-PROFILE" as const;
export const REG_LIVE_OPERATIONS_FINAL_CERTIFICATION = "REG-LIVE-OPERATIONS-FINAL-CERTIFICATION" as const;

export const LIVE_OPERATIONS_REGISTRY_IDS = [
  REG_LIVE_OPERATIONS_DOMAIN,
  REG_LIVE_OPERATIONS_PROFILE,
  REG_LIVE_OPERATIONS_FINAL_CERTIFICATION,
] as const;

export type LiveOperationsRegistryId = (typeof LIVE_OPERATIONS_REGISTRY_IDS)[number];

/** Tier 3 — Grand King Production Workspace (G7-01, Pillow-governed) */
export const REG_WORKSPACE = "REG-WORKSPACE" as const;
export const REG_READINESS_POLICY = "REG-READINESS-POLICY" as const;
export const REG_CONNECTION_PROVIDER = "REG-CONNECTION-PROVIDER" as const;
export const REG_IDENTITY_PROVIDER = "REG-IDENTITY-PROVIDER" as const;
export const REG_EXECUTIVE_POLICY = "REG-EXECUTIVE-POLICY" as const;
export const REG_FINANCIAL_POLICY = "REG-FINANCIAL-POLICY" as const;
export const REG_OPTIMIZATION_POLICY = "REG-OPTIMIZATION-POLICY" as const;
export const REG_IDENTITY_MONITOR = "REG-IDENTITY-MONITOR" as const;

export const PRODUCTION_WORKSPACE_REGISTRY_IDS = [
  REG_WORKSPACE,
  REG_READINESS_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_IDENTITY_PROVIDER,
  REG_EXECUTIVE_POLICY,
  REG_FINANCIAL_POLICY,
  REG_OPTIMIZATION_POLICY,
  REG_IDENTITY_MONITOR,
] as const;

export type ProductionWorkspaceRegistryId = (typeof PRODUCTION_WORKSPACE_REGISTRY_IDS)[number];

/** Tier 3 — Identity & Authorization Platform (G8-00, Pillow-governed) */
export const REG_AUTHORIZATION_PROVIDER = "REG-AUTHORIZATION-PROVIDER" as const;
export const REG_CREDENTIAL_TYPE = "REG-CREDENTIAL-TYPE" as const;
export const REG_CONNECTION_TYPE = "REG-CONNECTION-TYPE" as const;
export const REG_CONNECTION_POLICY = "REG-CONNECTION-POLICY" as const;
export const REG_IDENTITY_REPORT = "REG-IDENTITY-REPORT" as const;
export const REG_IDENTITY_NOTIFICATION = "REG-IDENTITY-NOTIFICATION" as const;

/** Tier 3 — Connection Registry (G8-01, Pillow-governed) */
export const REG_CONNECTION_SCOPE = "REG-CONNECTION-SCOPE" as const;
export const REG_CONNECTION_PERMISSION = "REG-CONNECTION-PERMISSION" as const;
export const REG_CONNECTION_ACCOUNT_HOLDER = "REG-CONNECTION-ACCOUNT-HOLDER" as const;
export const REG_CONNECTION_REQUIREMENT = "REG-CONNECTION-REQUIREMENT" as const;
export const REG_CONNECTION_CAPABILITY = "REG-CONNECTION-CAPABILITY" as const;
export const REG_CONNECTION_DEPENDENCY = "REG-CONNECTION-DEPENDENCY" as const;

export const CONNECTION_REGISTRY_REGISTRY_IDS = [
  REG_CONNECTION_SCOPE,
  REG_CONNECTION_PERMISSION,
  REG_CONNECTION_ACCOUNT_HOLDER,
  REG_CONNECTION_REQUIREMENT,
  REG_CONNECTION_CAPABILITY,
  REG_CONNECTION_DEPENDENCY,
] as const;

export type ConnectionRegistryRegistryId = (typeof CONNECTION_REGISTRY_REGISTRY_IDS)[number];

/** G8-01 canonical connection registry set (includes shared IAP/production-workspace refs) */
export const CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS = [
  REG_CONNECTION_PROVIDER,
  REG_CONNECTION_TYPE,
  REG_CONNECTION_SCOPE,
  REG_CONNECTION_PERMISSION,
  REG_CONNECTION_ACCOUNT_HOLDER,
  REG_CONNECTION_REQUIREMENT,
  REG_CONNECTION_CAPABILITY,
  REG_CONNECTION_DEPENDENCY,
] as const;

export const IDENTITY_AUTHORIZATION_REGISTRY_IDS = [
  REG_AUTHORIZATION_PROVIDER,
  REG_CREDENTIAL_TYPE,
  REG_CONNECTION_TYPE,
  REG_CONNECTION_POLICY,
  REG_IDENTITY_REPORT,
  REG_IDENTITY_NOTIFICATION,
] as const;

export type IdentityAuthorizationRegistryId = (typeof IDENTITY_AUTHORIZATION_REGISTRY_IDS)[number];

/** G8-00 canonical IAP registry set (includes production-workspace tier refs) */
export const IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS = [
  REG_IDENTITY_PROVIDER,
  REG_AUTHORIZATION_PROVIDER,
  REG_CREDENTIAL_TYPE,
  REG_CONNECTION_TYPE,
  REG_CONNECTION_POLICY,
  REG_READINESS_POLICY,
  REG_IDENTITY_MONITOR,
  REG_IDENTITY_REPORT,
  REG_IDENTITY_NOTIFICATION,
] as const;

export const COMMERCE_REGISTRY_IDS = [
  REG_MARKETPLACE,
  REG_SUPPLIER,
  REG_STOREFRONT,
  REG_PAYMENT,
  REG_LOGISTICS,
  REG_COUNTRY_COMMERCE,
  REG_CATEGORY,
  REG_BRAND,
  REG_PRODUCT_SOURCE,
  REG_COMMERCE_POLICY,
] as const;

export type CommerceRegistryId = (typeof COMMERCE_REGISTRY_IDS)[number];

/** Tier 5 — Derived views (computed, not row stores) */
export const DERIVED_DISCOVERY_SNAPSHOT = "DERIVED-DISCOVERY-SNAPSHOT" as const;
export const DERIVED_ACTIVATION_SNAPSHOT = "DERIVED-ACTIVATION-SNAPSHOT" as const;
export const DERIVED_READINESS_SNAPSHOT = "DERIVED-READINESS-SNAPSHOT" as const;

export const REGISTRY_IDS = [
  REG_DOCTRINE,
  REG_BUSINESS_RULE,
  REG_REGION,
  REG_COUNTRY,
  REG_MARKETPLACE,
  REG_SUPPLIER,
  REG_PROVIDER,
  REG_INTEGRATION,
  REG_CHANNEL,
  REG_DEPLOYMENT_PROFILE,
  REG_SCORING_POLICY,
  REG_PRICING_POLICY,
  REG_AI_ENGINE,
  REG_WORKFLOW,
  REG_TENANT,
  REG_COMPANY,
  REG_BRAND,
  REG_CATEGORY,
  REG_PRODUCT,
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
  REG_STOREFRONT,
  REG_PAYMENT,
  REG_LOGISTICS,
  REG_COUNTRY_COMMERCE,
  REG_PRODUCT_SOURCE,
  REG_COMMERCE_POLICY,
  REG_CERTIFICATION_DOMAIN,
  REG_CERTIFICATION_CHECK,
  REG_CERTIFICATION_GATE,
  REG_CERTIFICATION_INTEGRITY,
  REG_CERTIFICATION_SECURITY,
  REG_CERTIFICATION_DEPLOYMENT,
  REG_CERTIFICATION_OPERATIONAL,
  REG_CERTIFICATION_BUSINESS,
  REG_CERTIFICATION_PERFORMANCE,
  REG_CERTIFICATION_EXECUTIVE,
  REG_CERTIFICATION_FAILURE_RECOVERY,
  REG_CERTIFICATION_SIMULATION,
  REG_CERTIFICATION_FINAL_READINESS,
  REG_LIVE_OPERATIONS_DOMAIN,
  REG_LIVE_OPERATIONS_PROFILE,
  REG_LIVE_OPERATIONS_FINAL_CERTIFICATION,
  REG_WORKSPACE,
  REG_READINESS_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_IDENTITY_PROVIDER,
  REG_EXECUTIVE_POLICY,
  REG_FINANCIAL_POLICY,
  REG_OPTIMIZATION_POLICY,
  REG_IDENTITY_MONITOR,
  REG_AUTHORIZATION_PROVIDER,
  REG_CREDENTIAL_TYPE,
  REG_CONNECTION_TYPE,
  REG_CONNECTION_POLICY,
  REG_IDENTITY_REPORT,
  REG_IDENTITY_NOTIFICATION,
  REG_CONNECTION_SCOPE,
  REG_CONNECTION_PERMISSION,
  REG_CONNECTION_ACCOUNT_HOLDER,
  REG_CONNECTION_REQUIREMENT,
  REG_CONNECTION_CAPABILITY,
  REG_CONNECTION_DEPENDENCY,
] as const;

export const DERIVED_VIEW_IDS = [
  DERIVED_DISCOVERY_SNAPSHOT,
  DERIVED_ACTIVATION_SNAPSHOT,
  DERIVED_READINESS_SNAPSHOT,
] as const;

export type RegistryId = (typeof REGISTRY_IDS)[number];
export type DerivedViewId = (typeof DERIVED_VIEW_IDS)[number];

export const REGISTRY_TIER_BY_ID: Record<RegistryId | DerivedViewId, RegistryTier> = {
  [REG_DOCTRINE]: "constitutional",
  [REG_BUSINESS_RULE]: "constitutional",
  [REG_REGION]: "platform_catalog",
  [REG_COUNTRY]: "platform_catalog",
  [REG_MARKETPLACE]: "platform_catalog",
  [REG_SUPPLIER]: "platform_catalog",
  [REG_STOREFRONT]: "platform_catalog",
  [REG_PAYMENT]: "deployment",
  [REG_LOGISTICS]: "deployment",
  [REG_COUNTRY_COMMERCE]: "platform_catalog",
  [REG_PRODUCT_SOURCE]: "deployment",
  [REG_COMMERCE_POLICY]: "policy_topology",
  [REG_PROVIDER]: "deployment",
  [REG_INTEGRATION]: "deployment",
  [REG_CHANNEL]: "deployment",
  [REG_DEPLOYMENT_PROFILE]: "deployment",
  [REG_SCORING_POLICY]: "policy_topology",
  [REG_PRICING_POLICY]: "policy_topology",
  [REG_AI_ENGINE]: "policy_topology",
  [REG_WORKFLOW]: "policy_topology",
  [REG_TENANT]: "workspace",
  [REG_COMPANY]: "workspace",
  [REG_BRAND]: "workspace",
  [REG_CATEGORY]: "workspace",
  [REG_PRODUCT]: "workspace",
  [REG_AUTOMATION_TRIGGER]: "policy_topology",
  [REG_AUTOMATION_WORKFLOW]: "policy_topology",
  [REG_AUTOMATION_SCHEDULE]: "deployment",
  [REG_AUTOMATION_POLICY]: "policy_topology",
  [REG_AUTOMATION_APPROVAL]: "policy_topology",
  [REG_AUTOMATION_EXECUTOR]: "policy_topology",
  [REG_AUTOMATION_RECOVERY]: "policy_topology",
  [REG_AUTOMATION_NOTIFICATION]: "deployment",
  [REG_AUTOMATION_REPORT]: "policy_topology",
  [REG_AUTOMATION_MONITOR]: "policy_topology",
  [REG_CERTIFICATION_DOMAIN]: "policy_topology",
  [REG_CERTIFICATION_CHECK]: "policy_topology",
  [REG_CERTIFICATION_GATE]: "policy_topology",
  [REG_CERTIFICATION_INTEGRITY]: "policy_topology",
  [REG_CERTIFICATION_SECURITY]: "policy_topology",
  [REG_CERTIFICATION_DEPLOYMENT]: "policy_topology",
  [REG_CERTIFICATION_OPERATIONAL]: "policy_topology",
  [REG_CERTIFICATION_BUSINESS]: "policy_topology",
  [REG_CERTIFICATION_PERFORMANCE]: "policy_topology",
  [REG_CERTIFICATION_EXECUTIVE]: "policy_topology",
  [REG_CERTIFICATION_FAILURE_RECOVERY]: "policy_topology",
  [REG_CERTIFICATION_SIMULATION]: "policy_topology",
  [REG_CERTIFICATION_FINAL_READINESS]: "policy_topology",
  [REG_LIVE_OPERATIONS_DOMAIN]: "policy_topology",
  [REG_LIVE_OPERATIONS_PROFILE]: "policy_topology",
  [REG_LIVE_OPERATIONS_FINAL_CERTIFICATION]: "policy_topology",
  [REG_WORKSPACE]: "policy_topology",
  [REG_READINESS_POLICY]: "policy_topology",
  [REG_CONNECTION_PROVIDER]: "policy_topology",
  [REG_IDENTITY_PROVIDER]: "policy_topology",
  [REG_EXECUTIVE_POLICY]: "policy_topology",
  [REG_FINANCIAL_POLICY]: "policy_topology",
  [REG_OPTIMIZATION_POLICY]: "policy_topology",
  [REG_IDENTITY_MONITOR]: "policy_topology",
  [REG_AUTHORIZATION_PROVIDER]: "policy_topology",
  [REG_CREDENTIAL_TYPE]: "policy_topology",
  [REG_CONNECTION_TYPE]: "policy_topology",
  [REG_CONNECTION_POLICY]: "policy_topology",
  [REG_IDENTITY_REPORT]: "policy_topology",
  [REG_IDENTITY_NOTIFICATION]: "policy_topology",
  [REG_CONNECTION_SCOPE]: "policy_topology",
  [REG_CONNECTION_PERMISSION]: "policy_topology",
  [REG_CONNECTION_ACCOUNT_HOLDER]: "policy_topology",
  [REG_CONNECTION_REQUIREMENT]: "policy_topology",
  [REG_CONNECTION_CAPABILITY]: "policy_topology",
  [REG_CONNECTION_DEPENDENCY]: "policy_topology",
  [DERIVED_DISCOVERY_SNAPSHOT]: "derived",
  [DERIVED_ACTIVATION_SNAPSHOT]: "derived",
  [DERIVED_READINESS_SNAPSHOT]: "derived",
};

export const FOUNDATION_WIRED_REGISTRY_IDS: readonly RegistryId[] = [
  REG_DOCTRINE,
  REG_REGION,
  REG_COUNTRY,
  REG_MARKETPLACE,
  REG_SUPPLIER,
  REG_CHANNEL,
  REG_DEPLOYMENT_PROFILE,
  ...AUTOMATION_REGISTRY_IDS,
  REG_STOREFRONT,
  REG_PAYMENT,
  REG_LOGISTICS,
  REG_COUNTRY_COMMERCE,
  REG_BRAND,
  REG_CATEGORY,
  REG_PRODUCT_SOURCE,
  REG_COMMERCE_POLICY,
  ...CERTIFICATION_REGISTRY_IDS,
  ...LIVE_OPERATIONS_REGISTRY_IDS,
  ...PRODUCTION_WORKSPACE_REGISTRY_IDS,
  ...IDENTITY_AUTHORIZATION_REGISTRY_IDS,
  ...CONNECTION_REGISTRY_REGISTRY_IDS,
];

export const FOUNDATION_PLACEHOLDER_REGISTRY_IDS: readonly RegistryId[] = REGISTRY_IDS.filter(
  (id) => !FOUNDATION_WIRED_REGISTRY_IDS.includes(id),
);

export function isRegistryId(value: string): value is RegistryId {
  return (REGISTRY_IDS as readonly string[]).includes(value);
}

export function isAutomationRegistryId(value: string): value is AutomationRegistryId {
  return (AUTOMATION_REGISTRY_IDS as readonly string[]).includes(value);
}

export function isCommerceRegistryId(value: string): value is CommerceRegistryId {
  return (COMMERCE_REGISTRY_IDS as readonly string[]).includes(value);
}

export function isCertificationRegistryId(value: string): value is CertificationRegistryId {
  return (CERTIFICATION_REGISTRY_IDS as readonly string[]).includes(value);
}

export function isLiveOperationsRegistryId(value: string): value is LiveOperationsRegistryId {
  return (LIVE_OPERATIONS_REGISTRY_IDS as readonly string[]).includes(value);
}

export function isProductionWorkspaceRegistryId(value: string): value is ProductionWorkspaceRegistryId {
  return (PRODUCTION_WORKSPACE_REGISTRY_IDS as readonly string[]).includes(value);
}

export function isIdentityAuthorizationRegistryId(value: string): value is IdentityAuthorizationRegistryId {
  return (IDENTITY_AUTHORIZATION_REGISTRY_IDS as readonly string[]).includes(value);
}

export function isConnectionRegistryRegistryId(value: string): value is ConnectionRegistryRegistryId {
  return (CONNECTION_REGISTRY_REGISTRY_IDS as readonly string[]).includes(value);
}

export function isDerivedViewId(value: string): value is DerivedViewId {
  return (DERIVED_VIEW_IDS as readonly string[]).includes(value);
}
