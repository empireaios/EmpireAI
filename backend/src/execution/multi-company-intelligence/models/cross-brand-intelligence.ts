import { z } from "zod";

/** Cross-brand intelligence synthesis across portfolio companies. */
export type CrossBrandIntelligence = {
  intelligenceId: string;
  sharedAudienceSegments: string[];
  complementaryBrands: string[];
  crossSellOpportunities: string[];
  brandConflictRisks: string[];
  portfolioSynergyScore: number;
  score: number;
  summary: string;
};

export const crossBrandIntelligenceSchema = z.object({
  intelligenceId: z.string().min(1),
  sharedAudienceSegments: z.array(z.string().min(1)).min(1),
  complementaryBrands: z.array(z.string().min(1)).min(1),
  crossSellOpportunities: z.array(z.string().min(1)).min(1),
  brandConflictRisks: z.array(z.string().min(1)),
  portfolioSynergyScore: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a CrossBrandIntelligence record shape. */
export function validateCrossBrandIntelligence(value: unknown): CrossBrandIntelligence {
  return crossBrandIntelligenceSchema.parse(value);
}
