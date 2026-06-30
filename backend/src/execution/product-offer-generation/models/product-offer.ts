import { z } from "zod";

import { offerSignalSchema, type OfferSignal } from "./offer-signal.js";

export type ProductOfferId = string;

export const OFFER_STYLES = [
  "PREMIUM",
  "VALUE",
  "PERFORMANCE",
  "CONVENIENCE",
] as const;

export type OfferStyle = (typeof OFFER_STYLES)[number];

/** Sellable offer generated for a brand product. */
export type ProductOffer = {
  offerId: ProductOfferId;
  workspaceId: string;
  brandId: string;
  productId: string;
  offerStyle: OfferStyle;
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  keyFeatures: string[];
  customerProblem: string;
  customerOutcome: string;
  callToAction: string;
  confidence: number;
  signals: OfferSignal[];
  createdAt: string;
  updatedAt: string;
};

export type ProductOfferCreateInput = Omit<
  ProductOffer,
  "offerId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const productOfferSchema = z.object({
  offerId: z.string().min(1),
  workspaceId: z.string().min(1),
  brandId: z.string().min(1),
  productId: z.string().min(1),
  offerStyle: z.enum(OFFER_STYLES),
  offerTitle: z.string().min(1),
  headline: z.string().min(1),
  valueProposition: z.string().min(1),
  keyBenefits: z.array(z.string()).min(1),
  keyFeatures: z.array(z.string()).min(1),
  customerProblem: z.string().min(1),
  customerOutcome: z.string().min(1),
  callToAction: z.string().min(1),
  confidence: z.number().min(0).max(100),
  signals: z.array(offerSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ProductOffer record shape. */
export function validateProductOffer(value: unknown): ProductOffer {
  return productOfferSchema.parse(value);
}
