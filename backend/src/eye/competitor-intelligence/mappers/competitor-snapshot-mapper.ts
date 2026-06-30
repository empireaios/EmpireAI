import { randomUUID } from "node:crypto";

import type { CompetitorWatchPayload } from "../../connectors/competitor-watch/competitor-watch-connector.js";
import type { EyeRawObservation } from "../../types.js";
import type { CompetitorSnapshot } from "../models/competitor-snapshot.js";

/** Maps a competitor watch observation to a CompetitorSnapshot. */
export function mapObservationToSnapshot(observation: EyeRawObservation): CompetitorSnapshot {
  const payload = observation.payload as unknown as CompetitorWatchPayload;

  return {
    snapshotId: randomUUID(),
    competitorId: payload.competitorId,
    competitorName: payload.competitorName,
    capturedAt: observation.fetchedAt,
    price: payload.price,
    currency: payload.currency,
    creativeHash: payload.creativeHash,
    creativeSummary: payload.creativeSummary,
    landingPageUrl: payload.landingPageUrl,
    landingPageHash: payload.landingPageHash,
    offerText: payload.offerText,
    reviewCount: payload.reviewCount,
    reviewRating: payload.reviewRating,
    bestsellerRank: payload.bestsellerRank,
    bestsellerCategory: payload.bestsellerCategory,
    observationId: observation.observationId,
    mock: observation.mock,
  };
}
