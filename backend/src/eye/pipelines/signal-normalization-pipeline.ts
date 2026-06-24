import { createHash, randomUUID } from "node:crypto";
import type { EyeRawObservation } from "../types.js";
import type { ProductSignal, ProductSignalQuery, ProductTrendDirection } from "../contract/product-signal.js";
import type { EyeSignalEnvelope, ProductSignalEnvelope } from "../contract/signal-envelope.js";

export function buildSubjectKey(domain: string, providerId: string, payload: Record<string, unknown>): string {
  const title = String(payload.productTitle ?? payload.title ?? payload.keywords ?? "unknown");
  const category = String(payload.category ?? "");
  const raw = `${domain}:${providerId}:${title}:${category}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function asTrendDirection(value: unknown): ProductTrendDirection {
  if (value === "rising" || value === "stable" || value === "falling") return value;
  return "stable";
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function computePayloadConfidence(payload: Record<string, unknown>): number {
  const fields = ["demandIndex", "competitionIndex", "marginEstimatePct", "productTitle", "category"];
  const populated = fields.filter((f) => payload[f] !== undefined && payload[f] !== null).length;
  return Math.round((populated / fields.length) * 100);
}

/** Normalizes raw connector observations into unified signal envelopes. */
export class SignalNormalizationPipeline {
  normalizeProductObservation(
    workspaceId: string,
    observation: EyeRawObservation,
    query?: ProductSignalQuery,
  ): ProductSignalEnvelope {
    const payload = observation.payload;
    const productTitle = String(payload.productTitle ?? query?.productTitle ?? "Unknown Product");
    const category = String(payload.category ?? query?.category ?? "Uncategorized");
    const subjectKey = buildSubjectKey("product", observation.providerId, {
      productTitle,
      category,
    });
    const now = new Date().toISOString();
    const confidence = computePayloadConfidence(payload);

    const productSignal: ProductSignal = {
      signalId: randomUUID(),
      providerId: observation.providerId,
      providerName: String(payload.providerName ?? observation.providerId),
      workspaceId,
      productTitle,
      category,
      demandIndex: asNumber(payload.demandIndex, 50),
      competitionIndex: asNumber(payload.competitionIndex, 50),
      marginEstimatePct: asNumber(payload.marginEstimatePct, 25),
      estimatedSellingPriceCents:
        typeof payload.estimatedSellingPriceCents === "number"
          ? payload.estimatedSellingPriceCents
          : undefined,
      monthlyOrdersEstimate:
        typeof payload.monthlyOrdersEstimate === "number"
          ? payload.monthlyOrdersEstimate
          : undefined,
      trendDirection: asTrendDirection(payload.trendDirection),
      listingCount: typeof payload.listingCount === "number" ? payload.listingCount : undefined,
      avgRating: typeof payload.avgRating === "number" ? payload.avgRating : undefined,
      confidence: observation.mock ? Math.min(confidence, 60) : confidence,
      mock: observation.mock,
      fetchedAt: observation.fetchedAt,
      normalizedAt: now,
      observationIds: [observation.observationId],
      subjectKey,
    };

    return {
      envelopeId: randomUUID(),
      workspaceId,
      domain: "product",
      providerId: observation.providerId,
      providerName: productSignal.providerName,
      subjectKey,
      payload: productSignal,
      confidence: productSignal.confidence,
      confidenceFactors: [
        {
          name: "payloadCompleteness",
          weight: 1,
          value: confidence,
          explanation: "Fraction of expected product fields populated",
        },
        ...(observation.mock
          ? [
              {
                name: "mockPenalty",
                weight: 1,
                value: 60,
                explanation: "Mock observations capped at 60 confidence",
              },
            ]
          : []),
      ],
      provenance: {
        observationIds: [observation.observationId],
        mock: observation.mock,
        fetchedAt: observation.fetchedAt,
        sourceRefs: observation.sourceRef ? [observation.sourceRef] : [],
      },
      normalizedAt: now,
    };
  }

  normalizeObservations(
    workspaceId: string,
    observations: EyeRawObservation[],
    query?: ProductSignalQuery,
  ): EyeSignalEnvelope[] {
    return observations.map((obs) => {
      if (obs.domain === "product") {
        return this.normalizeProductObservation(workspaceId, obs, query);
      }
      const now = new Date().toISOString();
      const subjectKey = buildSubjectKey(obs.domain, obs.providerId, obs.payload);
      return {
        envelopeId: randomUUID(),
        workspaceId,
        domain: obs.domain,
        providerId: obs.providerId,
        providerName: String(obs.payload.providerName ?? obs.providerId),
        subjectKey,
        payload: obs.payload,
        confidence: obs.mock ? 40 : 70,
        confidenceFactors: [],
        provenance: {
          observationIds: [obs.observationId],
          mock: obs.mock,
          fetchedAt: obs.fetchedAt,
          sourceRefs: obs.sourceRef ? [obs.sourceRef] : [],
        },
        normalizedAt: now,
      };
    });
  }
}

export const defaultSignalNormalizationPipeline = new SignalNormalizationPipeline();
