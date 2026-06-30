import { z } from "zod";

/** Seasonal demand pattern for inventory planning. */
export type SeasonalityProfile = {
  profileId: string;
  peakMonths: string[];
  lowMonths: string[];
  seasonalityIndex: number;
  peakMultiplier: number;
  lowMultiplier: number;
  score: number;
};

export const seasonalityProfileSchema = z.object({
  profileId: z.string().min(1),
  peakMonths: z.array(z.string().min(1)).min(1),
  lowMonths: z.array(z.string().min(1)).min(1),
  seasonalityIndex: z.number().min(0).max(100),
  peakMultiplier: z.number().min(1),
  lowMultiplier: z.number().min(0).max(1),
  score: z.number().min(0).max(100),
});

/** Validates a SeasonalityProfile record shape. */
export function validateSeasonalityProfile(value: unknown): SeasonalityProfile {
  return seasonalityProfileSchema.parse(value);
}
