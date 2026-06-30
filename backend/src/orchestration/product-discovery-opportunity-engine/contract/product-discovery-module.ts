export const PRODUCT_DISCOVERY_MODULE_ID = "product-discovery-opportunity-engine" as const;

export type ProductDiscoveryCapability =
  | "product-discovery-opportunity-engine.read"
  | "product-discovery-opportunity-engine.discover"
  | "product-discovery-opportunity-engine.approve";

export const PRODUCT_DISCOVERY_CAPABILITIES: ProductDiscoveryCapability[] = [
  "product-discovery-opportunity-engine.read",
  "product-discovery-opportunity-engine.discover",
  "product-discovery-opportunity-engine.approve",
];

export function createProductDiscoveryModuleContract() {
  return {
    moduleId: PRODUCT_DISCOVERY_MODULE_ID,
    capabilities: PRODUCT_DISCOVERY_CAPABILITIES,
    missionId: "LIVE-005" as const,
    integratesWith: [
      "product-scout",
      "supplier-intelligence-engine",
      "brand-genesis",
      "marketing-campaign-intelligence",
      "commerce-readiness-engine",
      "marketplace-connection-engine",
    ],
  };
}
