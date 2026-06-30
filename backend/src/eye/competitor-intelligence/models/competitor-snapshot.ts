import { z } from "zod";

/** Point-in-time competitor observation snapshot. */
export type CompetitorSnapshot = {
  snapshotId: string;
  competitorId: string;
  competitorName: string;
  capturedAt: string;
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
  observationId: string;
  mock: boolean;
};

export const competitorSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  competitorId: z.string().min(1),
  competitorName: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
  price: z.number().min(0),
  currency: z.string().min(1),
  creativeHash: z.string().min(1),
  creativeSummary: z.string().min(1),
  landingPageUrl: z.string().min(1),
  landingPageHash: z.string().min(1),
  offerText: z.string().min(1),
  reviewCount: z.number().int().min(0),
  reviewRating: z.number().min(0).max(5),
  bestsellerRank: z.number().int().min(1).nullable(),
  bestsellerCategory: z.string().nullable(),
  observationId: z.string().min(1),
  mock: z.boolean(),
});

/** Validates a CompetitorSnapshot record shape. */
export function validateCompetitorSnapshot(value: unknown): CompetitorSnapshot {
  return competitorSnapshotSchema.parse(value);
}
