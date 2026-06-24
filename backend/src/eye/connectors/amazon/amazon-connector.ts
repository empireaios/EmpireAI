import { randomUUID } from "node:crypto";
import type { EyeConnector } from "../../contract/eye-connector.js";
import type {
  EyeConnectorContext,
  EyeConnectorDefinition,
  EyeConnectorHealth,
  EyeObserveRequest,
  EyeRawObservation,
  EyeSignalDomain,
} from "../../types.js";
import {
  AMAZON_PROVIDER_ID,
  AMAZON_PROVIDER_NAME,
  mapAmazonToObservationPayload,
  mapObservationPayloadToRaw,
} from "./mappers/product-signal-mapper.js";
import type { AmazonProductQuery } from "./models/amazon-product.js";
import {
  createMockAmazonDataSource,
  type MockAmazonDataSource,
} from "./mock/mock-amazon-data-source.js";
import { MockBestsellerCategoryProvider } from "./parsers/bestseller-parser.js";

export type AmazonConnectorOptions = {
  dataSource?: MockAmazonDataSource;
  supportedDomains?: readonly EyeSignalDomain[];
  defaultPollIntervalSec?: number;
  rateLimitPerMinute?: number;
};

function parseObserveQuery(query: Record<string, unknown>): AmazonProductQuery {
  return {
    asin: typeof query.asin === "string" ? query.asin : undefined,
    productTitle: typeof query.productTitle === "string" ? query.productTitle : undefined,
    category: typeof query.category === "string" ? query.category : undefined,
    marketplace: typeof query.marketplace === "string" ? query.marketplace : undefined,
  };
}

/**
 * Observation-only Amazon connector — learns FROM Amazon marketplace signals.
 * Uses mock data source internally; no live API calls or credentials.
 */
export class AmazonConnector implements EyeConnector {
  readonly definition: EyeConnectorDefinition;
  private connectedWorkspaces = new Set<string>();
  private readonly dataSource: MockAmazonDataSource;
  readonly bestsellerCategories: MockBestsellerCategoryProvider;

  constructor(options: AmazonConnectorOptions = {}) {
    this.dataSource = options.dataSource ?? createMockAmazonDataSource();
    this.bestsellerCategories = new MockBestsellerCategoryProvider();
    this.definition = {
      providerId: AMAZON_PROVIDER_ID,
      providerName: AMAZON_PROVIDER_NAME,
      supportedDomains: options.supportedDomains ?? ["product", "trend"],
      observationMode: "poll",
      defaultPollIntervalSec: options.defaultPollIntervalSec ?? 3600,
      rateLimitPerMinute: options.rateLimitPerMinute ?? 30,
    };
  }

  async connect(context: EyeConnectorContext, _credentialsRef: string): Promise<void> {
    this.connectedWorkspaces.add(context.workspaceId);
  }

  async disconnect(context: EyeConnectorContext): Promise<void> {
    this.connectedWorkspaces.delete(context.workspaceId);
  }

  async healthCheck(context: EyeConnectorContext): Promise<EyeConnectorHealth> {
    const connected = this.connectedWorkspaces.has(context.workspaceId);
    return {
      status: connected ? "active" : "registered",
      healthState: connected ? "healthy" : "unknown",
      message: connected
        ? "Amazon product intelligence connector active (mock observation mode)"
        : "Amazon connector registered but not connected",
      checkedAt: new Date().toISOString(),
    };
  }

  async observe(
    context: EyeConnectorContext,
    request: EyeObserveRequest,
  ): Promise<EyeRawObservation[]> {
    if (!this.definition.supportedDomains.includes(request.domain)) {
      return [];
    }

    const query = parseObserveQuery(request.query);
    const product = await this.dataSource.fetchProduct(query);
    const ranking = await this.dataSource.fetchRanking(product.asin);
    const reviews = await this.dataSource.fetchReviewStatistics(product.asin);
    const priceHistory = await this.dataSource.getPriceHistory(product.asin);

    const payload = mapAmazonToObservationPayload(product, ranking, reviews, priceHistory);
    const fetchedAt = new Date().toISOString();
    const observationId = randomUUID();

    return [
      mapObservationPayloadToRaw(payload, fetchedAt, observationId),
    ];
  }

  async discover(
    _context: EyeConnectorContext,
    domain: EyeSignalDomain,
    seed: Record<string, unknown>,
  ): Promise<EyeRawObservation[]> {
    if (domain !== "product" && domain !== "trend") {
      return [];
    }

    const categoryId = String(seed.categoryId ?? "kitchen-blenders");
    const listing = await this.bestsellerCategories.getBestsellersInCategory(categoryId, 3);
    const observations: EyeRawObservation[] = [];

    for (const asin of listing.asins) {
      const obs = await this.observe(
        { workspaceId: String(seed.workspaceId ?? "discovery"), correlationId: randomUUID() },
        {
          domain: "product",
          query: { asin, category: listing.categoryPath.join(" > ") },
        },
      );
      observations.push(...obs);
    }

    return observations;
  }
}

export function createAmazonConnector(options?: AmazonConnectorOptions): EyeConnector {
  return new AmazonConnector(options);
}
