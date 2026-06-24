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
  GOOGLE_TRENDS_PROVIDER_ID,
  GOOGLE_TRENDS_PROVIDER_NAME,
  mapTrendsToObservationPayload,
  mapObservationPayloadToRaw,
} from "./mappers/product-signal-mapper.js";
import type { TrendsQuery } from "./models/trends-query.js";
import {
  createMockTrendsDataSource,
  resolveKeyword,
  type MockTrendsDataSource,
} from "./mock/mock-trends-data-source.js";
import { MockTrendingTopicsProvider } from "./parsers/trends-parser.js";

export type GoogleTrendsConnectorOptions = {
  dataSource?: MockTrendsDataSource;
  supportedDomains?: readonly EyeSignalDomain[];
  defaultPollIntervalSec?: number;
  rateLimitPerMinute?: number;
};

function parseObserveQuery(query: Record<string, unknown>): TrendsQuery {
  return {
    keyword: typeof query.keyword === "string" ? query.keyword : undefined,
    productTitle: typeof query.productTitle === "string" ? query.productTitle : undefined,
    category: typeof query.category === "string" ? query.category : undefined,
    region: typeof query.region === "string" ? query.region : undefined,
    timeframe: typeof query.timeframe === "string" ? query.timeframe : undefined,
  };
}

/**
 * Observation-only Google Trends connector — learns FROM search trend signals.
 * Uses mock data source internally; no live API calls or credentials.
 */
export class GoogleTrendsConnector implements EyeConnector {
  readonly definition: EyeConnectorDefinition;
  private connectedWorkspaces = new Set<string>();
  private readonly dataSource: MockTrendsDataSource;
  readonly trendingTopics: MockTrendingTopicsProvider;

  constructor(options: GoogleTrendsConnectorOptions = {}) {
    this.dataSource = options.dataSource ?? createMockTrendsDataSource();
    this.trendingTopics = new MockTrendingTopicsProvider();
    this.definition = {
      providerId: GOOGLE_TRENDS_PROVIDER_ID,
      providerName: GOOGLE_TRENDS_PROVIDER_NAME,
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
        ? "Google Trends connector active (mock observation mode)"
        : "Google Trends connector registered but not connected",
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
    const normalizedKeyword = resolveKeyword(query);
    const interest = await this.dataSource.fetchSearchInterest(query);
    const momentum = await this.dataSource.fetchMomentum(normalizedKeyword);
    const seasonality = await this.dataSource.fetchSeasonality(normalizedKeyword);
    const geo = await this.dataSource.fetchGeoPopularity(normalizedKeyword);
    const breakout = await this.dataSource.fetchBreakout(normalizedKeyword);

    const category = query.category ?? "Uncategorized";
    const payload = mapTrendsToObservationPayload(
      interest,
      momentum,
      seasonality,
      geo,
      breakout,
      category,
      normalizedKeyword,
    );
    const fetchedAt = new Date().toISOString();
    const observationId = randomUUID();

    return [mapObservationPayloadToRaw(payload, fetchedAt, observationId)];
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
    const listing = await this.trendingTopics.getTrendingKeywords(categoryId, 3);
    const observations: EyeRawObservation[] = [];

    for (const keyword of listing.keywords) {
      const obs = await this.observe(
        { workspaceId: String(seed.workspaceId ?? "discovery"), correlationId: randomUUID() },
        {
          domain: "product",
          query: { keyword, category: listing.categoryPath.join(" > ") },
        },
      );
      observations.push(...obs);
    }

    return observations;
  }
}

export function createGoogleTrendsConnector(
  options?: GoogleTrendsConnectorOptions,
): EyeConnector {
  return new GoogleTrendsConnector(options);
}
