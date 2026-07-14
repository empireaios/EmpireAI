/** R1-03 — Amazon Product API client (structural — consumes R1-02 connector). */

import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import { AMAZON_CATALOG_API_PATHS } from "./paths.js";
import { appendProductLog } from "./amzprod-logging.js";
import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";
import type { FetchAmazonProductInput, RawAmazonProductPayload } from "./types.js";

/** Structural catalog fixtures for R1-03 — no live SP-API HTTP. */
export const STRUCTURAL_CATALOG_FIXTURES: RawAmazonProductPayload[] = [
  {
    asin: "B08N5WRWNW",
    sku: "AMZ-SKU-001",
    title: "Echo Dot (4th Gen) Smart Speaker",
    description: "Compact smart speaker with Alexa",
    category: "Electronics > Smart Home",
    images: ["https://images.amazon.com/echo-dot-4.jpg"],
    attributes: { brand: "Amazon", color: "Charcoal" },
    status: "active",
  },
  {
    asin: "B07XJ8C8F5",
    sku: "AMZ-SKU-002",
    title: "Fire TV Stick 4K",
    description: "Streaming media player with 4K HDR",
    category: "Electronics > Streaming",
    images: ["https://images.amazon.com/fire-tv-stick.jpg"],
    attributes: { brand: "Amazon", resolution: "4K" },
    status: "active",
  },
  {
    asin: "B09B8V1LZ3",
    sku: "AMZ-SKU-003",
    title: "Kindle Paperwhite",
    description: "Waterproof e-reader with adjustable warm light",
    category: "Electronics > E-Readers",
    images: ["https://images.amazon.com/kindle-paperwhite.jpg"],
    attributes: { brand: "Amazon", storage: "8GB" },
    status: "active",
  },
];

export class AmazonProductApiClient {
  constructor(private readonly amazonIntegration: AmazonMarketplaceIntegrationEngine | null) {}

  async fetchCatalogListings(
    region: "na" | "fe" | "eu",
    config: AmazonProductIntelligenceConfiguration,
    options?: { updatedTitle?: string; omitAsin?: string },
  ): Promise<RawAmazonProductPayload[]> {
    appendProductLog({
      event: "product_fetch",
      level: "info",
      details: `Fetching Amazon catalog listings (region=${region})`,
    });

    if (this.amazonIntegration) {
      const connector = this.amazonIntegration.getConnectorRecord();
      if (!connector || connector.currentOperationalState !== "active") {
        throw new Error("Amazon connector not active — connect Amazon before syncing products");
      }
      await this.amazonIntegration.routeAmazonApi({
        method: "GET",
        path: AMAZON_CATALOG_API_PATHS.listItems,
        region,
      });
    }

    void config;
    let fixtures = [...STRUCTURAL_CATALOG_FIXTURES];
    if (options?.updatedTitle) {
      fixtures = fixtures.map((p, i) =>
        i === 0 ? { ...p, title: options.updatedTitle! } : p,
      );
    }
    if (options?.omitAsin) {
      fixtures = fixtures.filter((p) => p.asin !== options.omitAsin);
    }
    return fixtures;
  }

  async fetchProductByAsin(
    input: FetchAmazonProductInput,
    config: AmazonProductIntelligenceConfiguration,
  ): Promise<RawAmazonProductPayload | null> {
    const region = input.region ?? "na";
    appendProductLog({
      event: "product_fetch",
      level: "info",
      details: `Fetching Amazon product ASIN=${input.asin} (region=${region})`,
    });

    if (this.amazonIntegration) {
      await this.amazonIntegration.routeAmazonApi({
        method: "GET",
        path: AMAZON_CATALOG_API_PATHS.getItem.replace("{asin}", input.asin),
        region,
      });
    }

    void config;
    return STRUCTURAL_CATALOG_FIXTURES.find((p) => p.asin === input.asin) ?? null;
  }
}
