import { z } from "zod";

export const META_PIXEL_EVENTS = [
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
  "Lead",
  "CompleteRegistration",
] as const;

export type MetaPixelEvent = (typeof META_PIXEL_EVENTS)[number];

/** Meta Pixel tracking blueprint. */
export type MetaPixelModel = {
  modelId: string;
  pixelId: string;
  pixelName: string;
  enabledEvents: MetaPixelEvent[];
  advancedMatchingFields: string[];
  automaticMatching: boolean;
  conversionApiEnabled: true;
  consentRequired: true;
};

export const metaPixelModelSchema = z.object({
  modelId: z.string().min(1),
  pixelId: z.string().min(1),
  pixelName: z.string().min(1),
  enabledEvents: z.array(z.enum(META_PIXEL_EVENTS)).min(1),
  advancedMatchingFields: z.array(z.string().min(1)),
  automaticMatching: z.boolean(),
  conversionApiEnabled: z.literal(true),
  consentRequired: z.literal(true),
});

/** Validates a MetaPixelModel record shape. */
export function validateMetaPixelModel(value: unknown): MetaPixelModel {
  return metaPixelModelSchema.parse(value);
}
