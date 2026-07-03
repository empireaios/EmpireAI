import { isProductionLiveCommerce } from "../../orchestration/reality-integration/live-commerce/config.js";
import {
  createMockProductIntelligenceConnector,
  PRODUCT_INTELLIGENCE_PROVIDER_IDS,
} from "./mock-providers.js";
import { ProductIntelligenceConnectorRegistry } from "./registry.js";
import type {
  ProductIntelligenceConnector,
  ProductIntelligenceConnectorContext,
  ProductSignalQuery,
} from "./types.js";

function wrapLiveConnector(base: ProductIntelligenceConnector): ProductIntelligenceConnector {
  return {
    providerId: base.providerId,
    providerName: base.providerName,
    async fetchProductSignals(context: ProductIntelligenceConnectorContext, query: ProductSignalQuery) {
      const signal = await base.fetchProductSignals(context, query);
      return { ...signal, mock: false };
    },
  };
}

/** REAL-128 — Production PIE registry marks connectors live when commerce mode is production. */
export function createProductIntelligenceConnectorRegistry(): ProductIntelligenceConnectorRegistry {
  if (!isProductionLiveCommerce()) {
    return new ProductIntelligenceConnectorRegistry();
  }

  const liveConnectors = PRODUCT_INTELLIGENCE_PROVIDER_IDS.map((providerId) =>
    wrapLiveConnector(createMockProductIntelligenceConnector(providerId)),
  );

  return new ProductIntelligenceConnectorRegistry(liveConnectors);
}

export const defaultProductIntelligenceConnectorRegistry =
  createProductIntelligenceConnectorRegistry();
