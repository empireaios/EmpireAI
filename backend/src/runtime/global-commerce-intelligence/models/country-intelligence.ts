import { z } from "zod";

/** B-011 — Per-country intelligence dimensions (0–100 unless noted). */
export const CountryIntelligenceDimensionsSchema = z.object({
  marketMaturity: z.number().min(0).max(100),
  marketGrowth: z.number().min(0).max(100),
  ecommercePenetration: z.number().min(0).max(100),
  digitalPaymentMaturity: z.number().min(0).max(100),
  logisticsMaturity: z.number().min(0).max(100),
  consumerPurchasingPower: z.number().min(0).max(100),
  languageComplexity: z.number().min(0).max(100),
  taxComplexity: z.number().min(0).max(100),
  businessFriendliness: z.number().min(0).max(100),
  marketplaceDensity: z.number().min(0).max(100),
  competitionIntensity: z.number().min(0).max(100),
  supplierAccessibility: z.number().min(0).max(100),
  crossBorderFriendliness: z.number().min(0).max(100),
  regulatoryDifficulty: z.number().min(0).max(100),
});

export type CountryIntelligenceDimensions = z.infer<typeof CountryIntelligenceDimensionsSchema>;

export const CountryIntelligenceProfileSchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  regionId: z.string(),
  dimensions: CountryIntelligenceDimensionsSchema,
  compositeScore: z.number().min(0).max(100),
  evidenceSummary: z.string(),
  dataSource: z.enum(["SEED", "COMPUTED", "REGISTRY_FALLBACK"]),
  computedAt: z.string(),
});

export type CountryIntelligenceProfile = z.infer<typeof CountryIntelligenceProfileSchema>;
