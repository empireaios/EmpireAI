import { z } from "zod";

export const GA4_EVENT_TYPES = [
  "page_view",
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "purchase",
  "sign_up",
  "generate_lead",
] as const;

export type Ga4EventType = (typeof GA4_EVENT_TYPES)[number];

/** Google Analytics 4 measurement blueprint. */
export type GoogleAnalyticsModel = {
  modelId: string;
  measurementId: string;
  streamName: string;
  enabledEvents: Ga4EventType[];
  customDimensions: string[];
  customMetrics: string[];
  enhancedMeasurement: string[];
  dataRetentionMonths: number;
  consentMode: "required";
};

export const googleAnalyticsModelSchema = z.object({
  modelId: z.string().min(1),
  measurementId: z.string().min(1),
  streamName: z.string().min(1),
  enabledEvents: z.array(z.enum(GA4_EVENT_TYPES)).min(1),
  customDimensions: z.array(z.string().min(1)),
  customMetrics: z.array(z.string().min(1)),
  enhancedMeasurement: z.array(z.string().min(1)),
  dataRetentionMonths: z.number().int().min(1),
  consentMode: z.literal("required"),
});

/** Validates a GoogleAnalyticsModel record shape. */
export function validateGoogleAnalyticsModel(value: unknown): GoogleAnalyticsModel {
  return googleAnalyticsModelSchema.parse(value);
}
