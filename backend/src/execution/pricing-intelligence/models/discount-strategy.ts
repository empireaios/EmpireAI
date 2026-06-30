import { z } from "zod";

export const DISCOUNT_TYPES = [
  "WELCOME",
  "CART_RECOVERY",
  "VOLUME",
  "SEASONAL",
  "LOYALTY",
] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/** Discount strategy with tiered offers. */
export type DiscountStrategy = {
  strategyId: string;
  maxDiscountPercent: number;
  minMarginFloorPercent: number;
  tiers: Array<{
    discountType: DiscountType;
    discountPercent: number;
    trigger: string;
    minOrderValue: number;
  }>;
  score: number;
};

export const discountStrategySchema = z.object({
  strategyId: z.string().min(1),
  maxDiscountPercent: z.number().min(0).max(100),
  minMarginFloorPercent: z.number().min(0).max(100),
  tiers: z
    .array(
      z.object({
        discountType: z.enum(DISCOUNT_TYPES),
        discountPercent: z.number().min(0).max(100),
        trigger: z.string().min(1),
        minOrderValue: z.number().min(0),
      }),
    )
    .min(1),
  score: z.number().min(0).max(100),
});

/** Validates a DiscountStrategy record shape. */
export function validateDiscountStrategy(value: unknown): DiscountStrategy {
  return discountStrategySchema.parse(value);
}
