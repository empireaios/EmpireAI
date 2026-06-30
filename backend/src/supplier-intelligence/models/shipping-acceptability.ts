import { z } from "zod";

/** SUP-005 — Shipping acceptability (time alone never rejects). */
export const shippingAcceptabilityInputSchema = z.object({
  targetCountry: z.string().min(2),
  category: z.string().min(1),
  shippingDaysMin: z.number().int().nonnegative(),
  shippingDaysMax: z.number().int().nonnegative(),
  pricePoint: z.number().nonnegative(),
  suggestedRetailPrice: z.number().nonnegative().optional(),
  marginPercent: z.number().min(0).max(100).optional(),
  marketplaceNormDays: z.number().int().nonnegative().optional(),
  competitorExpectationDays: z.number().int().nonnegative().optional(),
});

export const shippingAcceptabilityResultSchema = z.object({
  acceptable: z.boolean(),
  acceptabilityScore: z.number().min(0).max(100),
  verdict: z.enum(["EXCELLENT", "ACCEPTABLE", "MARGINAL", "REVIEW_REQUIRED"]),
  factors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
    note: z.string(),
  })),
  /** Shipping time alone never auto-rejects — only flags review. */
  shippingTimeAloneWouldReject: z.literal(false),
  computedAt: z.string().datetime({ offset: true }),
});

export type ShippingAcceptabilityInput = z.infer<typeof shippingAcceptabilityInputSchema>;
export type ShippingAcceptabilityResult = z.infer<typeof shippingAcceptabilityResultSchema>;
