import { z } from "zod";

export const COMPETITOR_CHANGE_TYPES = [
  "PRICE_CHANGE",
  "CREATIVE_CHANGE",
  "LANDING_PAGE",
  "OFFER",
  "REVIEW",
  "BEST_SELLER",
] as const;

export type CompetitorChangeType = (typeof COMPETITOR_CHANGE_TYPES)[number];

export const COMPETITOR_CHANGE_LABELS: Record<CompetitorChangeType, string> = {
  PRICE_CHANGE: "Price Change",
  CREATIVE_CHANGE: "Creative Change",
  LANDING_PAGE: "Landing Page",
  OFFER: "Offer",
  REVIEW: "Review",
  BEST_SELLER: "Best Seller",
};

export const competitorChangeTypeSchema = z.enum(COMPETITOR_CHANGE_TYPES);

/** Validates a CompetitorChangeType value. */
export function validateCompetitorChangeType(value: unknown): CompetitorChangeType {
  return competitorChangeTypeSchema.parse(value);
}
