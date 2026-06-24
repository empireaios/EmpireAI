import { z } from "zod";

import { matchingSignalSchema, type MatchingSignal } from "./matching-signal.js";

export type BuyerProductMatchId = string;

export const MATCH_TIERS = ["high", "medium", "low", "none"] as const;
export type MatchTier = (typeof MATCH_TIERS)[number];

/** Match result linking a buyer persona to a canonical product. */
export type BuyerProductMatch = {
  id: BuyerProductMatchId;
  workspaceId: string;
  buyerPersonaId: string;
  productId: string;
  score: number;
  confidence: number;
  matchTier: MatchTier;
  reasons: string[];
  matchingSignals: MatchingSignal[];
  createdAt: string;
  updatedAt: string;
};

export type BuyerProductMatchCreateInput = Omit<
  BuyerProductMatch,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type BuyerProductMatchUpdateInput = Partial<
  Omit<BuyerProductMatchCreateInput, "buyerPersonaId" | "productId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const buyerProductMatchSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  buyerPersonaId: z.string().min(1),
  productId: z.string().min(1),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  matchTier: z.enum(MATCH_TIERS),
  reasons: z.array(z.string()),
  matchingSignals: z.array(matchingSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a BuyerProductMatch record shape. */
export function validateBuyerProductMatch(value: unknown): BuyerProductMatch {
  return buyerProductMatchSchema.parse(value);
}

/** Maps a numeric score to a match tier. */
export function resolveMatchTier(score: number): MatchTier {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  if (score >= 20) return "low";
  return "none";
}
