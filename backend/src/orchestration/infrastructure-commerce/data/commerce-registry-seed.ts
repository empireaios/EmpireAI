/**
 * G2-01 — Foundation commerce registry seed rows.
 * Structural examples only — no hardcoded marketplace names, suppliers, products, or brands.
 * Imported exclusively by registry/sources/commerce-source.ts (EA-004).
 */

import type {
  CommerceBrandRow,
  CommerceCategoryRow,
  CommerceCountryCommerceRow,
  CommerceLogisticsRow,
  CommerceMarketplaceRow,
  CommercePaymentRow,
  CommercePolicyRow,
  CommerceProductSourceRow,
  CommerceStorefrontRow,
  CommerceSupplierRow,
} from "../../../registry/types/commerce-registry-types.js";
import { MARKETPLACE_INTEGRATION_VERSION } from "../marketplace/contracts/marketplace-integration-types.js";
import { SUPPLIER_INTEGRATION_VERSION } from "../supplier/contracts/supplier-integration-types.js";
import { STOREFRONT_INTEGRATION_VERSION } from "../storefront/contracts/storefront-integration-types.js";
import { PAYMENT_INTEGRATION_VERSION } from "../payment/contracts/payment-integration-types.js";
import { LOGISTICS_INTEGRATION_VERSION } from "../logistics/contracts/logistics-integration-types.js";

const foundationDomainContracts = {
  authentication: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: true },
  catalogue: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: true },
  orders: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: true },
  inventory: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: true },
  pricing: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: true },
  fulfillment: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: true },
  status: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: true },
} as const;

const primaryMarketplaceIntegrationFramework = {
  schemaVersion: MARKETPLACE_INTEGRATION_VERSION,
  authenticationMethod: "oauth2" as const,
  apiSpecification: {
    protocol: "rest" as const,
    specificationVersion: "generic-v1",
    transportProfile: "framework-default",
  },
  rateLimits: {
    requestsPerMinute: 60,
    burst: 10,
    policyRef: "pol-foundation-commerce-default",
  },
  supportedFeatures: [
    "catalogue_sync",
    "order_ingest",
    "inventory_sync",
    "pricing_sync",
    "fulfillment_handoff",
    "status_polling",
    "health_probe",
  ] as const,
  domainContracts: foundationDomainContracts,
};

const secondaryMarketplaceIntegrationFramework = {
  ...primaryMarketplaceIntegrationFramework,
  apiSpecification: {
    protocol: "event_driven" as const,
    specificationVersion: "generic-v1",
    transportProfile: "framework-webhook",
  },
  supportedFeatures: ["status_polling", "health_probe", "webhook_ingress"] as const,
  domainContracts: {
    ...foundationDomainContracts,
    catalogue: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: false },
    orders: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: false },
    inventory: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: false },
    pricing: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: false },
    fulfillment: { contractVersion: MARKETPLACE_INTEGRATION_VERSION, supported: false },
  },
};

const supplierFoundationDomainContracts = {
  authentication: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: true },
  catalogue: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: true },
  inventory: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: true },
  pricing: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: true },
  orders: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: true },
  fulfillment: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: true },
  tracking: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: true },
} as const;

const primarySupplierIntegrationFramework = {
  schemaVersion: SUPPLIER_INTEGRATION_VERSION,
  authenticationMethod: "api_key" as const,
  apiSpecification: {
    protocol: "rest" as const,
    specificationVersion: "generic-v1",
    transportProfile: "framework-default",
  },
  rateLimits: {
    requestsPerMinute: 120,
    burst: 20,
    policyRef: "pol-foundation-commerce-default",
  },
  fulfilmentModes: ["dropship", "3pl"] as const,
  inventoryFeatures: ["real_time_stock", "lead_time_signal", "restock_alert"] as const,
  trackingFeatures: ["shipment_status", "carrier_events", "tracking_webhook"] as const,
  supportedFeatures: [
    "catalogue_sync",
    "inventory_sync",
    "pricing_sync",
    "order_submit",
    "fulfillment_handoff",
    "tracking_poll",
    "health_probe",
  ] as const,
  domainContracts: supplierFoundationDomainContracts,
};

const secondarySupplierIntegrationFramework = {
  ...primarySupplierIntegrationFramework,
  authenticationMethod: "signed_request" as const,
  apiSpecification: {
    protocol: "event_driven" as const,
    specificationVersion: "generic-v1",
    transportProfile: "framework-webhook",
  },
  fulfilmentModes: ["wholesale", "warehouse"] as const,
  inventoryFeatures: ["reserved_stock", "warehouse_split"] as const,
  trackingFeatures: ["delivery_confirmation", "exception_alerts"] as const,
  supportedFeatures: ["catalogue_sync", "inventory_sync", "health_probe", "webhook_ingress"] as const,
  domainContracts: {
    ...supplierFoundationDomainContracts,
    orders: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: false },
    pricing: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: false },
    tracking: { contractVersion: SUPPLIER_INTEGRATION_VERSION, supported: false },
  },
};

const storefrontFoundationDomainContracts = {
  provisioning: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: true },
  brand_assignment: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: true },
  theme_assignment: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: true },
  product_publishing: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: true },
  collection_management: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: true },
  navigation_management: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: true },
  content_synchronisation: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: true },
} as const;

const primaryStorefrontIntegrationFramework = {
  schemaVersion: STOREFRONT_INTEGRATION_VERSION,
  channelModel: "hosted" as const,
  authenticationMethod: "oauth2" as const,
  publishingCapabilities: [
    "product_publish",
    "product_unpublish",
    "collection_publish",
    "navigation_publish",
    "content_publish",
  ] as const,
  themeCapabilities: ["theme_bind", "theme_preview", "theme_swap", "layout_configure"] as const,
  collectionCapabilities: [
    "collection_create",
    "collection_update",
    "collection_sync",
    "collection_archive",
  ] as const,
  contentCapabilities: ["content_sync", "content_localize", "content_preview"] as const,
  domainContracts: storefrontFoundationDomainContracts,
  brandRef: "brd-foundation-template",
  categoryRef: "cat-foundation-root",
};

const secondaryStorefrontIntegrationFramework = {
  ...primaryStorefrontIntegrationFramework,
  channelModel: "headless" as const,
  authenticationMethod: "api_key" as const,
  publishingCapabilities: ["product_publish", "content_publish"] as const,
  themeCapabilities: ["layout_configure"] as const,
  collectionCapabilities: ["collection_sync"] as const,
  contentCapabilities: ["content_sync"] as const,
  domainContracts: {
    ...storefrontFoundationDomainContracts,
    brand_assignment: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: false },
    navigation_management: { contractVersion: STOREFRONT_INTEGRATION_VERSION, supported: false },
  },
  brandRef: undefined,
  categoryRef: "cat-foundation-root",
};

const paymentFoundationDomainContracts = {
  authentication: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: true },
  payment_intent: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: true },
  authorisation: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: true },
  capture: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: true },
  refund: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: true },
  payout: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: false },
  webhook: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: true },
} as const;

const primaryPaymentIntegrationFramework = {
  schemaVersion: PAYMENT_INTEGRATION_VERSION,
  authenticationMethod: "oauth2" as const,
  paymentMethods: ["card", "digital_wallet", "bank_transfer"] as const,
  supportedCurrencies: ["USD", "EUR", "GBP"],
  refundSupport: { supported: true, policyRef: "pol-foundation-commerce-default" },
  payoutSupport: { supported: false, policyRef: "pol-foundation-commerce-default" },
  webhookSupport: { supported: true, policyRef: "pol-foundation-commerce-default" },
  securityFeatures: [
    "tokenisation",
    "webhook_verification",
    "provider_authentication",
    "permission_isolation",
    "credential_isolation",
    "future_vault",
  ] as const,
  domainContracts: paymentFoundationDomainContracts,
};

const secondaryPaymentIntegrationFramework = {
  ...primaryPaymentIntegrationFramework,
  authenticationMethod: "api_key" as const,
  paymentMethods: ["card", "bnpl", "cryptocurrency", "future_technology"] as const,
  supportedCurrencies: ["USD"],
  payoutSupport: { supported: true, policyRef: "pol-foundation-commerce-default" },
  domainContracts: {
    ...paymentFoundationDomainContracts,
    authorisation: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: false },
    capture: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: false },
    refund: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: false },
    payout: { contractVersion: PAYMENT_INTEGRATION_VERSION, supported: true },
  },
};

const logisticsFoundationDomainContracts = {
  authentication: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: true },
  shipment_creation: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: true },
  rate_quotation: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: true },
  tracking: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: true },
  delivery_status: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: true },
  return_shipment: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: true },
  warehouse: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: false },
} as const;

const primaryLogisticsIntegrationFramework = {
  schemaVersion: LOGISTICS_INTEGRATION_VERSION,
  authenticationMethod: "oauth2" as const,
  providerKind: "courier" as const,
  shippingServices: [
    { serviceId: "ship-standard", serviceKind: "courier" as const, supported: true },
    { serviceId: "ship-express", serviceKind: "courier" as const, supported: true },
  ],
  trackingServices: [
    { serviceId: "track-standard", serviceKind: "courier" as const, supported: true },
    { serviceId: "track-webhook", serviceKind: "courier" as const, supported: true },
  ],
  returnServices: [
    { serviceId: "return-standard", serviceKind: "courier" as const, supported: true },
  ],
  warehouseServices: [] as const,
  domainContracts: logisticsFoundationDomainContracts,
};

const secondaryLogisticsIntegrationFramework = {
  ...primaryLogisticsIntegrationFramework,
  authenticationMethod: "api_key" as const,
  providerKind: "3pl" as const,
  shippingServices: [
    { serviceId: "ship-freight", serviceKind: "freight" as const, supported: true },
  ],
  trackingServices: [
    { serviceId: "track-freight", serviceKind: "freight" as const, supported: true },
  ],
  returnServices: [] as const,
  warehouseServices: [
    { serviceId: "wh-inbound", serviceKind: "warehouse" as const, supported: true },
    { serviceId: "wh-outbound", serviceKind: "warehouse" as const, supported: true },
  ],
  domainContracts: {
    ...logisticsFoundationDomainContracts,
    shipment_creation: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: false },
    rate_quotation: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: false },
    return_shipment: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: false },
    warehouse: { contractVersion: LOGISTICS_INTEGRATION_VERSION, supported: true },
  },
};

const baseRow = {
  status: "VALIDATED" as const,
  version: "1.0.0",
  owner: "pillow:governance",
  dependencies: [] as string[],
  capabilities: ["foundation"],
  configuration: {},
  supportedRegions: ["global"],
  supportedCountries: ["*"],
  validation: { schemaVersion: "g2-01-v1", rules: ["foundation-seed"] },
  pluginSupport: { allowPluginRegistration: true },
  workspaceScope: { scope: "global" as const },
  futureCompatibility: { minSchemaVersion: "g2-01-v1" },
};

export const COMMERCE_POLICY_SEED_ROWS: CommercePolicyRow[] = [
  {
    ...baseRow,
    id: "pol-foundation-commerce-default",
    name: "Foundation Commerce Default Policy",
    description: "Default readiness, sync, and publish policy bindings for G2 foundation",
    dependencies: [],
    capabilities: ["readiness", "sync", "publish"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_provider" },
    policyKind: "default",
    rules: ["require-pillow-governance", "require-registry-resolution"],
    enforcement: "blocking",
  },
];

export const COMMERCE_COUNTRY_COMMERCE_SEED_ROWS: CommerceCountryCommerceRow[] = [
  {
    ...baseRow,
    id: "cty-foundation-global-template",
    name: "Foundation Global Commerce Country Template",
    description: "Template country commerce profile — region and currency resolved at runtime",
    dependencies: ["pol-foundation-commerce-default"],
    countryCode: "ZZ",
    regionRef: "reg-foundation-global",
    currencyCodes: ["USD"],
    commercePolicyRef: "pol-foundation-commerce-default",
    supportedCountries: ["ZZ"],
    supportedRegions: ["global"],
  },
];

export const COMMERCE_MARKETPLACE_SEED_ROWS: CommerceMarketplaceRow[] = [
  {
    ...baseRow,
    id: "mkt-foundation-primary-channel",
    name: "Foundation Primary Marketplace Channel",
    description: "Generic marketplace channel binding — provider resolved from REG-PROVIDER at runtime",
    dependencies: ["pol-foundation-commerce-default", "cty-foundation-global-template"],
    capabilities: ["connection", "publish-route"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_marketplace" },
    channelType: "marketplace",
    providerRef: "prov-foundation-marketplace-adapter",
    policyRef: "pol-foundation-commerce-default",
    supportedCountries: ["US", "SG", "GB"],
    supportedRegions: ["north-america", "apac", "europe"],
    configuration: {
      integrationFramework: primaryMarketplaceIntegrationFramework,
    },
  },
  {
    ...baseRow,
    id: "mkt-foundation-secondary-channel",
    name: "Foundation Secondary Marketplace Channel",
    description: "Secondary marketplace channel slot for deployment profile activation",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["connection"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_marketplace" },
    channelType: "marketplace",
    providerRef: "prov-foundation-marketplace-adapter-alt",
    policyRef: "pol-foundation-commerce-default",
    supportedCountries: ["US"],
    supportedRegions: ["north-america"],
    configuration: {
      integrationFramework: secondaryMarketplaceIntegrationFramework,
    },
  },
];

export const COMMERCE_SUPPLIER_SEED_ROWS: CommerceSupplierRow[] = [
  {
    ...baseRow,
    id: "sup-foundation-primary-fulfillment",
    name: "Foundation Primary Supplier Fulfillment",
    description: "Generic supplier fulfillment binding — adapter resolved from registry at runtime",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["catalog-sync", "fulfillment-handoff"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_supplier" },
    fulfillmentModel: "dropship",
    providerRef: "prov-foundation-supplier-adapter",
    policyRef: "pol-foundation-commerce-default",
    configuration: {
      integrationFramework: primarySupplierIntegrationFramework,
    },
  },
  {
    ...baseRow,
    id: "sup-foundation-secondary-wholesale",
    name: "Foundation Secondary Wholesale Supplier",
    description: "Secondary supplier slot for wholesale and warehouse fulfilment activation",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["catalog-sync"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_supplier" },
    fulfillmentModel: "wholesale",
    providerRef: "prov-foundation-supplier-adapter-alt",
    policyRef: "pol-foundation-commerce-default",
    supportedCountries: ["US"],
    supportedRegions: ["north-america"],
    configuration: {
      integrationFramework: secondarySupplierIntegrationFramework,
    },
  },
];

export const COMMERCE_STOREFRONT_SEED_ROWS: CommerceStorefrontRow[] = [
  {
    ...baseRow,
    id: "sto-foundation-managed-storefront",
    name: "Foundation Managed Storefront",
    description: "Generic managed storefront deployment template",
    dependencies: ["pol-foundation-commerce-default", "brd-foundation-template"],
    capabilities: ["deploy", "domain-bind", "publish-route"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_storefront" },
    hostingModel: "managed",
    deploymentRef: "dep-foundation-storefront",
    policyRef: "pol-foundation-commerce-default",
    configuration: {
      integrationFramework: primaryStorefrontIntegrationFramework,
    },
  },
  {
    ...baseRow,
    id: "sto-foundation-headless-storefront",
    name: "Foundation Headless Storefront",
    description: "Headless commerce channel template for API-first storefront activation",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["deploy", "publish-route"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_storefront" },
    hostingModel: "headless",
    deploymentRef: "dep-foundation-storefront-headless",
    policyRef: "pol-foundation-commerce-default",
    supportedCountries: ["US"],
    supportedRegions: ["north-america"],
    configuration: {
      integrationFramework: secondaryStorefrontIntegrationFramework,
    },
  },
];

export const COMMERCE_PAYMENT_SEED_ROWS: CommercePaymentRow[] = [
  {
    ...baseRow,
    id: "pay-foundation-psp-primary",
    name: "Foundation Primary Payment Provider",
    description: "Generic PSP binding — provider resolved from REG-PROVIDER at runtime",
    dependencies: ["pol-foundation-commerce-default", "cty-foundation-global-template"],
    capabilities: ["authorize", "capture", "refund"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_payment" },
    paymentKind: "psp",
    providerRef: "prov-foundation-payment-adapter",
    policyRef: "pol-foundation-commerce-default",
    supportedCountries: ["US", "SG", "GB"],
    supportedRegions: ["north-america", "apac", "europe"],
    configuration: {
      integrationFramework: primaryPaymentIntegrationFramework,
    },
  },
  {
    ...baseRow,
    id: "pay-foundation-psp-secondary",
    name: "Foundation Secondary Payment Provider",
    description: "Secondary payment provider slot for payout and alternative method activation",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["authorize", "payout"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_payment" },
    paymentKind: "psp",
    providerRef: "prov-foundation-payment-adapter-alt",
    policyRef: "pol-foundation-commerce-default",
    supportedCountries: ["US"],
    supportedRegions: ["north-america"],
    configuration: {
      integrationFramework: secondaryPaymentIntegrationFramework,
    },
  },
];

export const COMMERCE_LOGISTICS_SEED_ROWS: CommerceLogisticsRow[] = [
  {
    ...baseRow,
    id: "log-foundation-carrier-primary",
    name: "Foundation Primary Logistics Carrier",
    description: "Generic logistics carrier binding for tracking normalization",
    dependencies: ["pol-foundation-commerce-default", "sup-foundation-primary-fulfillment"],
    capabilities: ["tracking", "status-normalize", "shipment-create"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_logistics" },
    logisticsKind: "carrier",
    providerRef: "prov-foundation-logistics-adapter",
    policyRef: "pol-foundation-commerce-default",
    supportedCountries: ["US", "SG", "GB"],
    supportedRegions: ["north-america", "apac", "europe"],
    configuration: {
      integrationFramework: primaryLogisticsIntegrationFramework,
    },
  },
  {
    ...baseRow,
    id: "log-foundation-warehouse-secondary",
    name: "Foundation Secondary Warehouse Logistics",
    description: "Secondary warehouse and 3PL slot for fulfilment activation",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["tracking", "warehouse-handoff"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_logistics" },
    logisticsKind: "3pl",
    providerRef: "prov-foundation-logistics-adapter-alt",
    policyRef: "pol-foundation-commerce-default",
    supportedCountries: ["US"],
    supportedRegions: ["north-america"],
    configuration: {
      integrationFramework: secondaryLogisticsIntegrationFramework,
    },
  },
];

export const COMMERCE_CATEGORY_SEED_ROWS: CommerceCategoryRow[] = [
  {
    ...baseRow,
    id: "cat-foundation-root",
    name: "Foundation Root Category",
    description: "Root commerce category template for workspace catalog binding",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["catalog-taxonomy"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_category" },
    categoryPath: "/foundation",
    workspaceScope: { scope: "workspace" },
  },
];

export const COMMERCE_BRAND_SEED_ROWS: CommerceBrandRow[] = [
  {
    ...baseRow,
    id: "brd-foundation-template",
    name: "Foundation Brand Template",
    description: "Workspace brand template — no literal brand names in foundation seed",
    dependencies: ["cat-foundation-root"],
    capabilities: ["brand-binding"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_brand" },
    brandScope: "workspace",
    workspaceScope: { scope: "workspace" },
  },
];

export const COMMERCE_PRODUCT_SOURCE_SEED_ROWS: CommerceProductSourceRow[] = [
  {
    ...baseRow,
    id: "psrc-foundation-channel-source",
    name: "Foundation Channel Product Source",
    description: "Generic product source binding from operational channel registry rows",
    dependencies: ["mkt-foundation-primary-channel", "sup-foundation-primary-fulfillment"],
    capabilities: ["discover", "import"],
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_product_source" },
    sourceKind: "marketplace",
    channelRef: "mkt-foundation-primary-channel",
    policyRef: "pol-foundation-commerce-default",
  },
];
