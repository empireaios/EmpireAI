import { z } from "zod";

export const JOURNEY_STAGE_TYPES = [
  "DISCOVERY",
  "LANDING",
  "BROWSE",
  "CART",
  "CHECKOUT",
  "POST_PURCHASE",
  "UPSELL",
  "REPEAT_PURCHASE",
  "ABANDONMENT",
  "RETURN_CUSTOMER",
] as const;

export type JourneyStageType = (typeof JOURNEY_STAGE_TYPES)[number];

export const JOURNEY_STAGE_LABELS: Record<JourneyStageType, string> = {
  DISCOVERY: "Discovery",
  LANDING: "Landing",
  BROWSE: "Browse",
  CART: "Cart",
  CHECKOUT: "Checkout",
  POST_PURCHASE: "Post Purchase",
  UPSELL: "Upsell",
  REPEAT_PURCHASE: "Repeat Purchase",
  ABANDONMENT: "Abandonment",
  RETURN_CUSTOMER: "Return Customer",
};

export const journeyStageTypeSchema = z.enum(JOURNEY_STAGE_TYPES);

/** Validates a JourneyStageType value. */
export function validateJourneyStageType(value: unknown): JourneyStageType {
  return journeyStageTypeSchema.parse(value);
}
