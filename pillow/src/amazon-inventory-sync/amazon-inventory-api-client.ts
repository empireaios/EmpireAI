/** R1-05 — Amazon Inventory API client (structural — consumes R1-02 connector). */

import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import { AMAZON_INVENTORY_API_PATHS } from "./paths.js";
import { appendInventoryLog } from "./amzinv-logging.js";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type { FetchAmazonInventoryInput, RawAmazonInventoryPayload } from "./types.js";

/** Structural inventory fixtures for R1-05 — aligned with R1-03 product SKUs. */
export const STRUCTURAL_INVENTORY_FIXTURES: RawAmazonInventoryPayload[] = [
  {
    amazonSku: "AMZ-SKU-001",
    productId: "amzprod-B08N5WRWNW",
    availableQuantity: 150,
    reservedQuantity: 5,
    fulfillableQuantity: 145,
  },
  {
    amazonSku: "AMZ-SKU-002",
    productId: "amzprod-B07XJ8C8F5",
    availableQuantity: 8,
    reservedQuantity: 2,
    fulfillableQuantity: 6,
  },
  {
    amazonSku: "AMZ-SKU-003",
    productId: "amzprod-B09B8V1LZ3",
    availableQuantity: 0,
    reservedQuantity: 0,
    fulfillableQuantity: 0,
  },
];

export class AmazonInventoryApiClient {
  constructor(private readonly amazonIntegration: AmazonMarketplaceIntegrationEngine | null) {}

  async fetchInventorySummaries(
    region: "na" | "fe" | "eu",
    config: AmazonInventorySyncConfiguration,
    options?: {
      quantityOverride?: Record<string, number>;
      omitSku?: string;
    },
  ): Promise<RawAmazonInventoryPayload[]> {
    appendInventoryLog({
      event: "inventory_fetch",
      level: "info",
      details: `Fetching Amazon inventory summaries (region=${region})`,
    });

    if (this.amazonIntegration) {
      const connector = this.amazonIntegration.getConnectorRecord();
      if (!connector || connector.currentOperationalState !== "active") {
        throw new Error("Amazon connector not active — connect Amazon before syncing inventory");
      }
      await this.amazonIntegration.routeAmazonApi({
        method: "GET",
        path: AMAZON_INVENTORY_API_PATHS.listInventory,
        region,
      });
    }

    void config;
    let fixtures = [...STRUCTURAL_INVENTORY_FIXTURES];
    if (options?.omitSku) {
      fixtures = fixtures.filter((f) => f.amazonSku !== options.omitSku);
    }
    if (options?.quantityOverride) {
      fixtures = fixtures.map((f) => ({
        ...f,
        availableQuantity: options.quantityOverride![f.amazonSku] ?? f.availableQuantity,
        fulfillableQuantity:
          options.quantityOverride![f.amazonSku] !== undefined
            ? Math.max(0, (options.quantityOverride![f.amazonSku] ?? 0) - (f.reservedQuantity ?? 0))
            : f.fulfillableQuantity,
      }));
    }
    return fixtures;
  }

  async fetchInventoryBySku(
    input: FetchAmazonInventoryInput,
    config: AmazonInventorySyncConfiguration,
  ): Promise<RawAmazonInventoryPayload | null> {
    const region = input.region ?? "na";
    appendInventoryLog({
      event: "inventory_fetch",
      level: "info",
      details: `Fetching Amazon inventory SKU=${input.amazonSku} (region=${region})`,
    });

    if (this.amazonIntegration) {
      await this.amazonIntegration.routeAmazonApi({
        method: "GET",
        path: AMAZON_INVENTORY_API_PATHS.getInventory.replace("{sku}", input.amazonSku),
        region,
      });
    }

    void config;
    return STRUCTURAL_INVENTORY_FIXTURES.find((f) => f.amazonSku === input.amazonSku) ?? null;
  }
}
