/** P8-03 — Marketplace Integration Architecture paths. */

export const MARKETPLACE_INTEGRATION_PATH =
  "docs/governance/EMPIREAI_MARKETPLACE_INTEGRATION_ARCHITECTURE.md" as const;

export const COMMERCE_ARCHITECTURE_COMPANION_PATH =
  "docs/architecture/EMPIREAI_COMMERCE_ARCHITECTURE.md" as const;

export const G2_MARKETPLACE_COMPANION_PATH =
  "backend/src/orchestration/infrastructure-commerce/marketplace/contracts/marketplace-integration-types.ts" as const;

export const MARKETPLACE_INTEGRATION_PRINCIPLES = [
  "Marketplace Independent",
  "Provider Independent",
  "API First",
  "Constitution First",
  "Automation First",
  "Evidence First",
  "Secure Integration",
  "Replaceable Connectors",
  "Future Extensibility",
] as const;

export const MARKETPLACE_INTEGRATION_PIPELINE = [
  "business_created",
  "marketplace_selected",
  "authentication",
  "store_connection",
  "catalogue_synchronization",
  "product_publishing",
  "inventory_synchronization",
  "order_synchronization",
  "fulfilment_synchronization",
  "analytics_synchronization",
  "continuous_monitoring",
] as const;

export const MARKETPLACE_SYNC_DOMAINS = [
  "products",
  "inventory",
  "orders",
  "customers",
  "shipments",
  "pricing",
  "status",
  "analytics",
  "errors",
] as const;

export const MARKETPLACE_CONNECTOR_CAPABILITIES = [
  "authentication",
  "catalogue_import",
  "product_publishing",
  "inventory_synchronization",
  "order_synchronization",
  "shipment_tracking",
  "customer_synchronization",
  "analytics",
  "marketing_integration",
  "webhook_processing",
] as const;

export const MARKETPLACE_FAILURE_KINDS = [
  "authentication_failure",
  "api_failure",
  "rate_limit",
  "network_failure",
  "provider_failure",
  "synchronization_failure",
] as const;
