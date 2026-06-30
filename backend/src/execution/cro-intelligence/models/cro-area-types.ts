import { z } from "zod";

export const CRO_AREA_TYPES = [
  "HEADLINES",
  "BUTTONS",
  "PRICING",
  "TRUST",
  "TESTIMONIALS",
  "LAYOUT",
  "OFFER",
  "URGENCY",
] as const;

export type CroAreaType = (typeof CRO_AREA_TYPES)[number];

export const CRO_AREA_LABELS: Record<CroAreaType, string> = {
  HEADLINES: "Headlines",
  BUTTONS: "Buttons",
  PRICING: "Pricing",
  TRUST: "Trust",
  TESTIMONIALS: "Testimonials",
  LAYOUT: "Layout",
  OFFER: "Offer",
  URGENCY: "Urgency",
};

export const croAreaTypeSchema = z.enum(CRO_AREA_TYPES);

/** Validates a CroAreaType value. */
export function validateCroAreaType(value: unknown): CroAreaType {
  return croAreaTypeSchema.parse(value);
}
