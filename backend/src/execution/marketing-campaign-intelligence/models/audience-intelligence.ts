import { z } from "zod";

/** Target audience intelligence for campaign planning. */
export type AudienceIntelligence = {
  countries: string[];
  ageRanges: string[];
  genders: string[];
  interests: string[];
  behaviors: string[];
  lookalikeRecommendation: string;
  customAudienceRecommendation: string;
};

export const audienceIntelligenceSchema = z.object({
  countries: z.array(z.string().min(1)).min(1),
  ageRanges: z.array(z.string().min(1)).min(1),
  genders: z.array(z.string().min(1)).min(1),
  interests: z.array(z.string().min(1)).min(1),
  behaviors: z.array(z.string().min(1)).min(1),
  lookalikeRecommendation: z.string().min(1),
  customAudienceRecommendation: z.string().min(1),
});

/** Validates an AudienceIntelligence record shape. */
export function validateAudienceIntelligence(value: unknown): AudienceIntelligence {
  return audienceIntelligenceSchema.parse(value);
}
