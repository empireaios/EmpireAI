import {
  createMockProductIntelligenceConnector,
  PRODUCT_INTELLIGENCE_PROVIDER_IDS,
} from "./mock-providers.js";
import type {
  ProductIntelligenceConnector,
  ProductIntelligenceConnectorContext,
  ProductIntelligenceProviderId,
  ProductIntelligenceSignal,
  ProductSignalQuery,
} from "./types.js";

export class ProductIntelligenceConnectorRegistry {
  private readonly connectors = new Map<
    ProductIntelligenceProviderId,
    ProductIntelligenceConnector
  >();

  constructor(overrides?: ProductIntelligenceConnector[]) {
    for (const providerId of PRODUCT_INTELLIGENCE_PROVIDER_IDS) {
      this.connectors.set(providerId, createMockProductIntelligenceConnector(providerId));
    }
    for (const connector of overrides ?? []) {
      this.connectors.set(connector.providerId, connector);
    }
  }

  register(connector: ProductIntelligenceConnector): void {
    this.connectors.set(connector.providerId, connector);
  }

  list(): ProductIntelligenceConnector[] {
    return [...this.connectors.values()];
  }

  listProviderIds(): ProductIntelligenceProviderId[] {
    return [...this.connectors.keys()];
  }

  get(providerId: ProductIntelligenceProviderId): ProductIntelligenceConnector | undefined {
    return this.connectors.get(providerId);
  }

  require(providerId: ProductIntelligenceProviderId): ProductIntelligenceConnector {
    const connector = this.get(providerId);
    if (!connector) {
      throw new Error(`Unknown product intelligence provider: ${providerId}`);
    }
    return connector;
  }

  async fetchAllSignals(
    context: ProductIntelligenceConnectorContext,
    query: ProductSignalQuery,
    providerIds?: ProductIntelligenceProviderId[],
  ): Promise<ProductIntelligenceSignal[]> {
    const targets = providerIds?.length
      ? providerIds.map((id) => this.require(id))
      : this.list();

    return Promise.all(
      targets.map((connector) => connector.fetchProductSignals(context, query)),
    );
  }
}

export const defaultProductIntelligenceConnectorRegistry =
  new ProductIntelligenceConnectorRegistry();
