import { z } from "zod";

export const ExpansionPlanInputSchema = z.object({
  productCategory: z.string().min(1),
  supplierAvailable: z.boolean().default(true),
  preferredLanguages: z.array(z.string()).optional(),
  preferredCurrencies: z.array(z.string()).optional(),
  maxCountries: z.number().int().min(1).max(50).default(10),
});

export type ExpansionPlanInput = z.infer<typeof ExpansionPlanInputSchema>;

export const ExpansionCountryRecommendationSchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  priorityRank: z.number().int(),
  priorityScore: z.number(),
  why: z.string(),
  estimatedEffort: z.enum(["LOW", "MEDIUM", "HIGH"]),
  manualActionsRequired: z.array(z.string()),
  expectedProfitOpportunity: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  priorityMarketplaces: z.array(
    z.object({
      providerId: z.string(),
      displayName: z.string(),
      onboardingStatus: z.string(),
      hasRuntimePlugin: z.boolean(),
    }),
  ),
  launchSequenceStep: z.number().int(),
});

export type ExpansionCountryRecommendation = z.infer<typeof ExpansionCountryRecommendationSchema>;

export const GlobalExpansionPlanSchema = z.object({
  planId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  productCategory: z.string(),
  priorityCountries: z.array(ExpansionCountryRecommendationSchema),
  launchSequence: z.array(z.string()),
  globalSummary: z.string(),
  computedAt: z.string(),
});

export type GlobalExpansionPlan = z.infer<typeof GlobalExpansionPlanSchema>;
