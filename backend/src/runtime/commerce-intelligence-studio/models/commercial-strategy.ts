import { z } from "zod";

export const COMMERCIAL_STRATEGIES = [
  "high_volume",
  "premium",
  "penetration",
  "cash_flow",
  "brand_building",
  "long_tail",
  "experimental",
] as const;

export type CommercialStrategyType = (typeof COMMERCIAL_STRATEGIES)[number];

export const STRATEGY_LABELS: Record<CommercialStrategyType, string> = {
  high_volume: "High Volume",
  premium: "Premium",
  penetration: "Penetration",
  cash_flow: "Cash Flow",
  brand_building: "Brand Building",
  long_tail: "Long Tail",
  experimental: "Experimental",
};

export const commercialStrategyRecommendationSchema = z.object({
  strategyId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  supplierProductId: z.string(),
  recommendedStrategy: z.enum(COMMERCIAL_STRATEGIES),
  displayName: z.string(),
  pricingStrategy: z.object({
    approach: z.string(),
    suggestedRetailPrice: z.number().positive(),
    marginPercent: z.number(),
    rationale: z.string(),
  }),
  expectedOutcome: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(100),
  alternativeStrategies: z.array(z.object({
    strategy: z.enum(COMMERCIAL_STRATEGIES),
    displayName: z.string(),
    fitScore: z.number().min(0).max(100),
  })),
  computedAt: z.string().datetime({ offset: true }),
});

export type CommercialStrategyRecommendation = z.infer<typeof commercialStrategyRecommendationSchema>;
