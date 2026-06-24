import { z } from "zod";
import type { ProductSignal } from "../../../../eye/contract/product-signal.js";
import type { EyeSignalDomain } from "../../../../eye/types.js";

/** Normalized buyer-facing signal derived from Eye connector output (Mission 023). */
export type BuyerSignal = {
  signalId: string;
  workspaceId: string;
  providerId: string;
  providerName: string;
  domain: EyeSignalDomain;
  subjectKey: string;
  productTitle?: string;
  category?: string;
  keywords: string[];
  demandIndex?: number;
  trendDirection?: "rising" | "stable" | "falling";
  searchVolumeIndex?: number;
  estimatedSellingPriceCents?: number;
  urgencyHints: string[];
  platformHints: string[];
  observationIds: string[];
  confidence: number;
  mock: boolean;
  fetchedAt: string;
  normalizedAt: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const buyerSignalSchema = z.object({
  signalId: z.string().min(1),
  workspaceId: z.string().min(1),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  domain: z.enum(["product", "trend", "supplier", "advertisement", "market", "risk"]),
  subjectKey: z.string().min(1),
  productTitle: z.string().optional(),
  category: z.string().optional(),
  keywords: z.array(z.string()),
  demandIndex: z.number().min(0).max(100).optional(),
  trendDirection: z.enum(["rising", "stable", "falling"]).optional(),
  searchVolumeIndex: z.number().min(0).max(100).optional(),
  estimatedSellingPriceCents: z.number().int().nonnegative().optional(),
  urgencyHints: z.array(z.string()),
  platformHints: z.array(z.string()),
  observationIds: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  mock: z.boolean(),
  fetchedAt: isoTimestamp,
  normalizedAt: isoTimestamp,
});

/** Validates a BuyerSignal record shape. */
export function validateBuyerSignal(value: unknown): BuyerSignal {
  return buyerSignalSchema.parse(value);
}

function tokenizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

/** Maps a normalized Eye ProductSignal into a BuyerSignal contract. */
export function buyerSignalFromProductSignal(signal: ProductSignal): BuyerSignal {
  const keywords = [...new Set([...(signal.productTitle ? tokenizeTitle(signal.productTitle) : []), signal.category.toLowerCase()])];
  const platformHints =
    signal.providerId.includes("amazon")
      ? ["amazon", "google"]
      : signal.providerId.includes("google") || signal.providerId.includes("trends")
        ? ["google", "youtube"]
        : ["web"];

  const urgencyHints: string[] = [];
  if (signal.trendDirection === "rising") {
    urgencyHints.push("rising_interest");
  }
  if (signal.demandIndex >= 75) {
    urgencyHints.push("high_demand");
  }
  if (signal.competitionIndex <= 35) {
    urgencyHints.push("low_competition_window");
  }

  return {
    signalId: signal.signalId,
    workspaceId: signal.workspaceId,
    providerId: signal.providerId,
    providerName: signal.providerName,
    domain: "product",
    subjectKey: signal.subjectKey,
    productTitle: signal.productTitle,
    category: signal.category,
    keywords,
    demandIndex: signal.demandIndex,
    trendDirection: signal.trendDirection,
    searchVolumeIndex: signal.demandIndex,
    estimatedSellingPriceCents: signal.estimatedSellingPriceCents,
    urgencyHints,
    platformHints,
    observationIds: [...signal.observationIds],
    confidence: signal.confidence,
    mock: signal.mock,
    fetchedAt: signal.fetchedAt,
    normalizedAt: signal.normalizedAt,
  };
}
