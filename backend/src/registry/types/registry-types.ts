/**
 * EA-003 — RegistryLoader core types and loader contract.
 */

import type { DerivedViewId, RegistryId, RegistryTier } from "./registry-ids.js";

export const REGISTRY_LIFECYCLE_STATES = [
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "ACTIVE",
  "DEPRECATED",
  "RETIRED",
] as const;

export type RegistryLifecycleState = (typeof REGISTRY_LIFECYCLE_STATES)[number];

export type RegistryLoaderContext = {
  workspaceId?: string;
  companyId?: string;
  deploymentProfileId?: string;
};

export type RegistryQuery = {
  countryCode?: string;
  registryRowId?: string;
  policyPackId?: string;
};

export type RegistrySnapshotMeta = {
  registryId: RegistryId | DerivedViewId;
  tier: RegistryTier;
  version: string;
  contentHash: string;
  loadedAt: string;
  deploymentProfileId: string;
  rowCount: number;
  wired: boolean;
};

export type RegistryResolveResult<T = unknown> = {
  meta: RegistrySnapshotMeta;
  rows: T[];
};

export type RegistryDerivedResult<T = unknown> = {
  meta: RegistrySnapshotMeta;
  view: T;
};

export type RegistryLoaderContract = {
  resolve<T = unknown>(
    context: RegistryLoaderContext,
    registryId: RegistryId,
    query?: RegistryQuery,
  ): RegistryResolveResult<T>;

  resolveDerivedView<T = unknown>(
    context: RegistryLoaderContext,
    viewId: DerivedViewId,
    query?: RegistryQuery,
  ): RegistryDerivedResult<T>;

  registerPlugin(manifest: import("./plugin-manifest.js").RegistryPluginManifest): void;

  listRegisteredPlugins(): readonly import("./plugin-manifest.js").RegistryPluginManifest[];

  listFoundationStatus(): Array<{
    registryId: RegistryId | DerivedViewId;
    tier: RegistryTier;
    wired: boolean;
  }>;
};

export type RegistryCachePolicy = "immutable" | "deployment" | "policy" | "workspace" | "derived";

export const CACHE_POLICY_BY_REGISTRY: Record<RegistryId | DerivedViewId, RegistryCachePolicy> = {
  "REG-DOCTRINE": "immutable",
  "REG-BUSINESS-RULE": "immutable",
  "REG-REGION": "immutable",
  "REG-COUNTRY": "immutable",
  "REG-MARKETPLACE": "immutable",
  "REG-SUPPLIER": "immutable",
  "REG-PROVIDER": "deployment",
  "REG-INTEGRATION": "derived",
  "REG-CHANNEL": "deployment",
  "REG-DEPLOYMENT-PROFILE": "deployment",
  "REG-SCORING-POLICY": "policy",
  "REG-PRICING-POLICY": "policy",
  "REG-AI-ENGINE": "immutable",
  "REG-WORKFLOW": "immutable",
  "REG-TENANT": "workspace",
  "REG-COMPANY": "workspace",
  "REG-BRAND": "workspace",
  "REG-CATEGORY": "workspace",
  "REG-PRODUCT": "workspace",
  "REG-STOREFRONT": "immutable",
  "REG-PAYMENT": "deployment",
  "REG-LOGISTICS": "deployment",
  "REG-COUNTRY-COMMERCE": "immutable",
  "REG-PRODUCT-SOURCE": "deployment",
  "REG-COMMERCE-POLICY": "policy",
  "REG-AUTOMATION-TRIGGER": "policy",
  "REG-AUTOMATION-WORKFLOW": "policy",
  "REG-AUTOMATION-SCHEDULE": "deployment",
  "REG-AUTOMATION-POLICY": "policy",
  "REG-AUTOMATION-APPROVAL": "policy",
  "REG-AUTOMATION-EXECUTOR": "policy",
  "REG-AUTOMATION-RECOVERY": "policy",
  "REG-AUTOMATION-NOTIFICATION": "deployment",
  "REG-AUTOMATION-REPORT": "policy",
  "REG-AUTOMATION-MONITOR": "policy",
  "REG-CERTIFICATION-DOMAIN": "policy",
  "REG-CERTIFICATION-CHECK": "policy",
  "REG-CERTIFICATION-GATE": "policy",
  "REG-CERTIFICATION-INTEGRITY": "policy",
  "REG-CERTIFICATION-SECURITY": "policy",
  "REG-CERTIFICATION-DEPLOYMENT": "policy",
  "REG-CERTIFICATION-OPERATIONAL": "policy",
  "REG-CERTIFICATION-BUSINESS": "policy",
  "REG-CERTIFICATION-PERFORMANCE": "policy",
  "REG-CERTIFICATION-EXECUTIVE": "policy",
  "REG-CERTIFICATION-FAILURE-RECOVERY": "policy",
  "REG-CERTIFICATION-SIMULATION": "policy",
  "REG-CERTIFICATION-FINAL-READINESS": "policy",
  "REG-LIVE-OPERATIONS-DOMAIN": "policy",
  "REG-LIVE-OPERATIONS-PROFILE": "policy",
  "REG-LIVE-OPERATIONS-FINAL-CERTIFICATION": "policy",
  "REG-WORKSPACE": "policy",
  "REG-READINESS-POLICY": "policy",
  "REG-CONNECTION-PROVIDER": "policy",
  "REG-IDENTITY-PROVIDER": "policy",
  "REG-EXECUTIVE-POLICY": "policy",
  "REG-FINANCIAL-POLICY": "policy",
  "REG-OPTIMIZATION-POLICY": "policy",
  "REG-IDENTITY-MONITOR": "policy",
  "REG-AUTHORIZATION-PROVIDER": "policy",
  "REG-CREDENTIAL-TYPE": "policy",
  "REG-CONNECTION-TYPE": "policy",
  "REG-CONNECTION-POLICY": "policy",
  "REG-IDENTITY-REPORT": "policy",
  "REG-IDENTITY-NOTIFICATION": "policy",
  "REG-CONNECTION-SCOPE": "policy",
  "REG-CONNECTION-PERMISSION": "policy",
  "REG-CONNECTION-ACCOUNT-HOLDER": "policy",
  "REG-CONNECTION-REQUIREMENT": "policy",
  "REG-CONNECTION-CAPABILITY": "policy",
  "REG-CONNECTION-DEPENDENCY": "policy",
  "DERIVED-DISCOVERY-SNAPSHOT": "derived",
  "DERIVED-ACTIVATION-SNAPSHOT": "derived",
  "DERIVED-READINESS-SNAPSHOT": "derived",
};

export const CACHE_TTL_MS: Record<RegistryCachePolicy, number> = {
  immutable: Number.POSITIVE_INFINITY,
  deployment: Number.POSITIVE_INFINITY,
  policy: 5 * 60 * 1000,
  workspace: 60 * 1000,
  derived: 30 * 1000,
};
