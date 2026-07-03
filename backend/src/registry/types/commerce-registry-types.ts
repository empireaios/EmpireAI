/**
 * G2-01 — Commerce registry row schemas (REG-COMMERCE programme registries).
 */

import { z } from "zod";

export const COMMERCE_REGISTRY_LIFECYCLE = [
  "DRAFT",
  "VALIDATED",
  "PUBLISHED",
  "DEPRECATED",
  "RETIRED",
] as const;

export type CommerceRegistryLifecycle = (typeof COMMERCE_REGISTRY_LIFECYCLE)[number];

export const COMMERCE_WORKSPACE_SCOPES = ["global", "workspace", "deployment"] as const;

export type CommerceWorkspaceScope = (typeof COMMERCE_WORKSPACE_SCOPES)[number];

export const COMMERCE_PLUGIN_KINDS = [
  "commerce_marketplace",
  "commerce_supplier",
  "commerce_storefront",
  "commerce_payment",
  "commerce_logistics",
  "commerce_analytics",
  "commerce_orchestration",
  "commerce_workflow",
  "commerce_validation",
  "commerce_monitoring",
  "commerce_future",
  "commerce_provider",
  "commerce_brand",
  "commerce_category",
  "commerce_product_source",
] as const;

export type CommercePluginKind = (typeof COMMERCE_PLUGIN_KINDS)[number];

export const COMMERCE_ENGINE_MODULES = [
  "marketplace-infrastructure-engine",
  "supplier-intelligence-engine",
  "storefront-assembly-engine",
  "advertising-intelligence-engine",
  "live-payment-engine",
  "order-execution-bridge",
  "analytics-intelligence-engine",
] as const;

export type CommerceEngineModule = (typeof COMMERCE_ENGINE_MODULES)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const commerceRegistryRowBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(COMMERCE_REGISTRY_LIFECYCLE),
  version: z.string().regex(semverPattern, "version must be semver (e.g. 1.0.0)"),
  owner: z.string().min(1),
  dependencies: z.array(z.string()),
  capabilities: z.array(z.string()),
  configuration: z.record(z.unknown()),
  supportedRegions: z.array(z.string()),
  supportedCountries: z.array(z.string()),
  validation: z.object({
    schemaVersion: z.string().min(1),
    rules: z.array(z.string()).optional(),
  }),
  pluginSupport: z.object({
    allowPluginRegistration: z.boolean(),
    pluginKind: z.enum(COMMERCE_PLUGIN_KINDS).optional(),
    pluginId: z.string().optional(),
  }),
  workspaceScope: z.object({
    scope: z.enum(COMMERCE_WORKSPACE_SCOPES),
    workspaceId: z.string().optional(),
    deploymentProfileId: z.string().optional(),
  }),
  futureCompatibility: z.object({
    minSchemaVersion: z.string().min(1),
    extensionFields: z.record(z.unknown()).optional(),
  }),
});

export type CommerceRegistryRowBase = z.infer<typeof commerceRegistryRowBaseSchema>;

export const commerceMarketplaceRowSchema = commerceRegistryRowBaseSchema.extend({
  channelType: z.enum(["marketplace", "hybrid"]),
  providerRef: z.string().optional(),
  policyRef: z.string().optional(),
});

export const commerceSupplierRowSchema = commerceRegistryRowBaseSchema.extend({
  fulfillmentModel: z.enum(["dropship", "wholesale", "3pl", "hybrid"]),
  providerRef: z.string().optional(),
  policyRef: z.string().optional(),
});

export const commerceStorefrontRowSchema = commerceRegistryRowBaseSchema.extend({
  hostingModel: z.enum(["managed", "headless", "marketplace_embedded"]),
  deploymentRef: z.string().optional(),
  policyRef: z.string().optional(),
});

export const commercePaymentRowSchema = commerceRegistryRowBaseSchema.extend({
  paymentKind: z.enum(["psp", "wallet", "bnpl", "marketplace_native"]),
  providerRef: z.string().optional(),
  policyRef: z.string().optional(),
});

export const commerceLogisticsRowSchema = commerceRegistryRowBaseSchema.extend({
  logisticsKind: z.enum(["carrier", "3pl", "marketplace_fulfilment", "supplier_direct"]),
  providerRef: z.string().optional(),
  policyRef: z.string().optional(),
});

export const commerceCountryCommerceRowSchema = commerceRegistryRowBaseSchema.extend({
  countryCode: z.string().length(2),
  regionRef: z.string().min(1),
  currencyCodes: z.array(z.string()).min(1),
  commercePolicyRef: z.string().optional(),
});

export const commerceCategoryRowSchema = commerceRegistryRowBaseSchema.extend({
  categoryPath: z.string().min(1),
  parentCategoryRef: z.string().optional(),
});

export const commerceBrandRowSchema = commerceRegistryRowBaseSchema.extend({
  brandScope: z.enum(["workspace", "company", "global_template"]),
  companyRef: z.string().optional(),
});

export const commerceProductSourceRowSchema = commerceRegistryRowBaseSchema.extend({
  sourceKind: z.enum(["marketplace", "supplier", "storefront", "manual", "plugin"]),
  channelRef: z.string().optional(),
  policyRef: z.string().optional(),
});

export const commercePolicyRowSchema = commerceRegistryRowBaseSchema.extend({
  policyKind: z.enum(["readiness", "sync", "publish", "payment", "fulfillment", "default"]),
  rules: z.array(z.string()).min(1),
  enforcement: z.enum(["advisory", "blocking"]),
});

export type CommerceMarketplaceRow = z.infer<typeof commerceMarketplaceRowSchema>;
export type CommerceSupplierRow = z.infer<typeof commerceSupplierRowSchema>;
export type CommerceStorefrontRow = z.infer<typeof commerceStorefrontRowSchema>;
export type CommercePaymentRow = z.infer<typeof commercePaymentRowSchema>;
export type CommerceLogisticsRow = z.infer<typeof commerceLogisticsRowSchema>;
export type CommerceCountryCommerceRow = z.infer<typeof commerceCountryCommerceRowSchema>;
export type CommerceCategoryRow = z.infer<typeof commerceCategoryRowSchema>;
export type CommerceBrandRow = z.infer<typeof commerceBrandRowSchema>;
export type CommerceProductSourceRow = z.infer<typeof commerceProductSourceRowSchema>;
export type CommercePolicyRow = z.infer<typeof commercePolicyRowSchema>;

export const COMMERCE_REGISTRY_VERSION = "g2-01-v1";
