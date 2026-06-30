import { z } from "zod";

export const OpportunityRankingInputSchema = z.object({
  productCategory: z.string().min(1),
  productName: z.string().optional(),
  supplierAvailable: z.boolean().default(true),
  preferredLanguages: z.array(z.string()).optional(),
  maxCountries: z.number().int().min(1).max(100).default(10),
  maxMarketplacesPerCountry: z.number().int().min(1).max(10).default(4),
});

export type OpportunityRankingInput = z.input<typeof OpportunityRankingInputSchema>;
export type OpportunityRankingInputParsed = z.infer<typeof OpportunityRankingInputSchema>;

export const RankedMarketplaceSchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  countryCode: z.string(),
  rank: z.number().int(),
  score: z.number(),
  why: z.string(),
  confidence: z.number().min(0).max(100),
  risk: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  effort: z.enum(["LOW", "MEDIUM", "HIGH"]),
  expectedRoi: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  expectedTimeToLaunchDays: z.number().int(),
  expectedManualWorkHours: z.number().int(),
  hasRuntimePlugin: z.boolean(),
});

export type RankedMarketplace = z.infer<typeof RankedMarketplaceSchema>;

export const RankedCountrySchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  rank: z.number().int(),
  expansionScore: z.number(),
  why: z.string(),
  confidence: z.number().min(0).max(100),
  risk: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  effort: z.enum(["LOW", "MEDIUM", "HIGH"]),
  expectedRoi: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  expectedTimeToLaunchDays: z.number().int(),
  expectedManualWorkHours: z.number().int(),
  launchOrder: z.number().int(),
  priorityMarketplaces: z.array(RankedMarketplaceSchema),
});

export type RankedCountry = z.infer<typeof RankedCountrySchema>;

export const OpportunityRankingResultSchema = z.object({
  rankingId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  productCategory: z.string(),
  rankedCountries: z.array(RankedCountrySchema),
  launchSequence: z.array(z.string()),
  globalSummary: z.string(),
  computedAt: z.string(),
});

export type OpportunityRankingResult = z.infer<typeof OpportunityRankingResultSchema>;
