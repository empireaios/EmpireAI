import { z } from "zod";

export const marketShareOpportunitySchema = z.object({
  countryCode: z.string(),
  marketplaceId: z.string(),
  category: z.string(),
  addressableMarketUsd: z.number(),
  currentSharePercent: z.number(),
  potentialSharePercent: z.number(),
  gapUsd: z.number(),
  rationale: z.string(),
});

export const globalMarketShareEngineSchema = z.object({
  moduleId: z.literal("global-market-share-engine"),
  missionId: z.literal("REAL-053"),
  workspaceId: z.string(),
  companyId: z.string(),
  addressableMarketUsd: z.number(),
  currentSharePercent: z.number(),
  potentialSharePercent: z.number(),
  opportunities: z.array(marketShareOpportunitySchema),
  reusedModules: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type GlobalMarketShareEngine = z.infer<typeof globalMarketShareEngineSchema>;
