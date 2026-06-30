import { randomUUID } from "node:crypto";

import type { EyeConnector } from "../../contract/eye-connector.js";
import type {
  EyeConnectorContext,
  EyeConnectorDefinition,
  EyeConnectorHealth,
  EyeObserveRequest,
  EyeRawObservation,
} from "../../types.js";

export const COMPETITOR_WATCH_PROVIDER_ID = "competitor-watch" as const;
export const COMPETITOR_WATCH_PROVIDER_NAME = "Competitor Watch (Mock)" as const;

export type CompetitorWatchPayload = {
  competitorId: string;
  competitorName: string;
  competitorDomain: string;
  price: number;
  currency: string;
  creativeHash: string;
  creativeSummary: string;
  landingPageUrl: string;
  landingPageHash: string;
  offerText: string;
  reviewCount: number;
  reviewRating: number;
  bestsellerRank: number | null;
  bestsellerCategory: string | null;
  cycle: number;
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildPayload(
  context: EyeConnectorContext,
  request: EyeObserveRequest,
  cycle: number,
): CompetitorWatchPayload {
  const competitorId = String(request.query.competitorId ?? "comp-default");
  const competitorName = String(request.query.competitorName ?? "Competitor Store");
  const competitorDomain = String(request.query.competitorDomain ?? "competitor.example");
  const category = String(request.query.category ?? "General");
  const seed = hashSeed(`${context.workspaceId}:${competitorId}:${category}`);

  const basePrice = 39.99 + (seed % 30);
  const priceDelta = cycle > 1 ? (cycle % 2 === 0 ? -4.99 : 5.99) : 0;
  const price = Math.round((basePrice + priceDelta) * 100) / 100;

  const creativeVariants = [
    "Hero video ad — lifestyle demo",
    "Static carousel — product features",
    "UGC testimonial creative",
  ];
  const creativeIndex = (seed + cycle) % creativeVariants.length;

  const offerVariants = [
    "Free shipping on orders over $45",
    "15% off first order — code SAVE15",
    "Bundle and save 20%",
  ];
  const offerIndex = cycle > 1 ? (seed + 1) % offerVariants.length : seed % offerVariants.length;

  const landingVariants = ["/products/hero", "/collections/sale", "/pages/landing-v2"];
  const landingIndex = cycle > 1 ? (seed + 2) % landingVariants.length : seed % landingVariants.length;
  const landingPath = landingVariants[landingIndex]!;

  const reviewCount = 120 + seed % 400 + cycle * 3;
  const reviewRating = Math.round((3.8 + (seed % 12) / 10) * 10) / 10;
  const bestsellerRank = seed % 5 === 0 ? null : 10 + (seed % 90) - cycle;

  return {
    competitorId,
    competitorName,
    competitorDomain,
    price,
    currency: "USD",
    creativeHash: `cr-${seed}-${creativeIndex}`,
    creativeSummary: creativeVariants[creativeIndex]!,
    landingPageUrl: `https://${competitorDomain}${landingPath}`,
    landingPageHash: `lp-${seed}-${landingIndex}`,
    offerText: offerVariants[offerIndex]!,
    reviewCount,
    reviewRating,
    bestsellerRank: bestsellerRank && bestsellerRank > 0 ? bestsellerRank : null,
    bestsellerCategory: category,
    cycle,
  };
}

/** Mock EyeConnector for competitor watch observations — no live API. */
export class CompetitorWatchConnector implements EyeConnector {
  readonly definition: EyeConnectorDefinition = {
    providerId: COMPETITOR_WATCH_PROVIDER_ID,
    providerName: COMPETITOR_WATCH_PROVIDER_NAME,
    supportedDomains: ["market", "advertisement", "product"],
    observationMode: "poll",
    defaultPollIntervalSec: 3600,
    rateLimitPerMinute: 30,
  };

  private connectedWorkspaces = new Set<string>();

  async connect(context: EyeConnectorContext): Promise<void> {
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
      message: connected ? "Competitor watch connector ready" : "Not connected",
      checkedAt: new Date().toISOString(),
    };
  }

  async observe(
    context: EyeConnectorContext,
    request: EyeObserveRequest,
  ): Promise<EyeRawObservation[]> {
    if (!this.connectedWorkspaces.has(context.workspaceId)) {
      throw new Error("CompetitorWatchConnector not connected");
    }

    const cycle = Number(request.query.cycle ?? 1);
    const payload = buildPayload(context, request, cycle);
    const fetchedAt = new Date().toISOString();

    return [
      {
        observationId: randomUUID(),
        providerId: COMPETITOR_WATCH_PROVIDER_ID,
        domain: request.domain,
        payload: payload as unknown as Record<string, unknown>,
        fetchedAt,
        mock: true,
        sourceRef: payload.competitorDomain,
      },
    ];
  }
}

/** Factory for a competitor watch connector. */
export function createCompetitorWatchConnector(): CompetitorWatchConnector {
  return new CompetitorWatchConnector();
}

export { buildPayload as buildCompetitorWatchPayload };
