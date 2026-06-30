import { z } from "zod";

export const TIKTOK_PIXEL_EVENTS = [
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "CompletePayment",
  "SubmitForm",
  "CompleteRegistration",
] as const;

export type TikTokPixelEvent = (typeof TIKTOK_PIXEL_EVENTS)[number];

/** TikTok Pixel tracking blueprint. */
export type TikTokPixelModel = {
  modelId: string;
  pixelId: string;
  pixelName: string;
  enabledEvents: TikTokPixelEvent[];
  advancedMatchingFields: string[];
  eventsApiEnabled: true;
  consentRequired: true;
};

export const tikTokPixelModelSchema = z.object({
  modelId: z.string().min(1),
  pixelId: z.string().min(1),
  pixelName: z.string().min(1),
  enabledEvents: z.array(z.enum(TIKTOK_PIXEL_EVENTS)).min(1),
  advancedMatchingFields: z.array(z.string().min(1)),
  eventsApiEnabled: z.literal(true),
  consentRequired: z.literal(true),
});

/** Validates a TikTokPixelModel record shape. */
export function validateTikTokPixelModel(value: unknown): TikTokPixelModel {
  return tikTokPixelModelSchema.parse(value);
}
