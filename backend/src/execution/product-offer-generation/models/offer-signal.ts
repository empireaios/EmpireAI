import { z } from "zod";

export const OFFER_SIGNAL_TYPES = [
  "brand_fit",
  "product_role",
  "knowledge_confidence",
  "opportunity_score",
  "supplier_match",
  "offer_style",
  "value_alignment",
  "offer_composite",
] as const;

export type OfferSignalType = (typeof OFFER_SIGNAL_TYPES)[number];

/** Individual factor contributing to product offer scoring. */
export type OfferSignal = {
  signalType: OfferSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const offerSignalSchema = z.object({
  signalType: z.enum(OFFER_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an OfferSignal record shape. */
export function validateOfferSignal(value: unknown): OfferSignal {
  return offerSignalSchema.parse(value);
}
