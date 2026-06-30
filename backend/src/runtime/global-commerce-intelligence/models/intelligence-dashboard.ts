import { z } from "zod";

export const HeatmapEntrySchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  expansionScore: z.number(),
  profitPotential: z.number(),
  risk: z.number(),
  competition: z.number(),
  automationPotential: z.number(),
});

export type HeatmapEntry = z.infer<typeof HeatmapEntrySchema>;

export const TimelineEntrySchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  readinessPercent: z.number(),
  estimatedLaunchWeeks: z.number().int(),
  phase: z.enum(["READY", "NEAR_READY", "IN_PROGRESS", "BLOCKED"]),
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

export const GlobalCommerceIntelligenceDashboardSchema = z.object({
  moduleId: z.literal("global-commerce-intelligence"),
  missionId: z.literal("B-011-B-015"),
  topCountries: z.array(z.object({ countryCode: z.string(), displayName: z.string(), expansionScore: z.number(), why: z.string() })),
  fastestExpansion: z.array(z.object({ countryCode: z.string(), displayName: z.string(), expectedTimeToLaunchDays: z.number() })),
  highestRoi: z.array(z.object({ countryCode: z.string(), displayName: z.string(), expectedRoi: z.string() })),
  highestAutomation: z.array(z.object({ countryCode: z.string(), displayName: z.string(), automationPotential: z.number() })),
  highestRisk: z.array(z.object({ countryCode: z.string(), displayName: z.string(), risk: z.string() })),
  highestCompetition: z.array(z.object({ countryCode: z.string(), displayName: z.string(), competitionIntensity: z.number() })),
  globalOpportunityHeatmap: z.array(HeatmapEntrySchema),
  expansionReadinessTimeline: z.array(TimelineEntrySchema),
  recommendedNextCountry: z.object({ countryCode: z.string(), displayName: z.string(), expansionScore: z.number(), why: z.string() }).nullable(),
  recommendedNextMarketplace: z.object({ providerId: z.string(), displayName: z.string(), countryCode: z.string(), why: z.string() }).nullable(),
  intelligenceCoverage: z.object({ countriesEvaluated: z.number(), seedCountries: z.number(), registryCountries: z.number() }),
  computedAt: z.string(),
});

export type GlobalCommerceIntelligenceDashboard = z.infer<typeof GlobalCommerceIntelligenceDashboardSchema>;
