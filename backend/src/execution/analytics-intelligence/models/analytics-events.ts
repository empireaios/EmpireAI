import { z } from "zod";

export const ANALYTICS_EVENT_SOURCES = ["CLIENT", "SERVER"] as const;

export type AnalyticsEventSource = (typeof ANALYTICS_EVENT_SOURCES)[number];

/** Server-side analytics event blueprint. */
export type ServerSideEvent = {
  eventId: string;
  eventName: string;
  source: "SERVER";
  platforms: Array<"GA4" | "META" | "TIKTOK">;
  trigger: string;
  payloadSchema: Record<string, string>;
  deduplicationKey: string;
};

export const serverSideEventSchema = z.object({
  eventId: z.string().min(1),
  eventName: z.string().min(1),
  source: z.literal("SERVER"),
  platforms: z.array(z.enum(["GA4", "META", "TIKTOK"])).min(1),
  trigger: z.string().min(1),
  payloadSchema: z.record(z.string(), z.string()),
  deduplicationKey: z.string().min(1),
});

/** Conversion event definition. */
export type ConversionEvent = {
  conversionId: string;
  name: string;
  eventName: string;
  value: number;
  currency: string;
  category: "PURCHASE" | "LEAD" | "SIGNUP" | "ADD_TO_CART" | "CHECKOUT";
  platforms: Array<"GA4" | "META" | "TIKTOK">;
  attributionWindowDays: number;
};

export const conversionEventSchema = z.object({
  conversionId: z.string().min(1),
  name: z.string().min(1),
  eventName: z.string().min(1),
  value: z.number().min(0),
  currency: z.string().length(3),
  category: z.enum(["PURCHASE", "LEAD", "SIGNUP", "ADD_TO_CART", "CHECKOUT"]),
  platforms: z.array(z.enum(["GA4", "META", "TIKTOK"])).min(1),
  attributionWindowDays: z.number().int().min(1),
});

/** Validates a ServerSideEvent record shape. */
export function validateServerSideEvent(value: unknown): ServerSideEvent {
  return serverSideEventSchema.parse(value);
}

/** Validates a ConversionEvent record shape. */
export function validateConversionEvent(value: unknown): ConversionEvent {
  return conversionEventSchema.parse(value);
}
