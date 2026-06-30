import { z } from "zod";

export const STOREFRONT_SIGNAL_TYPES = [
  "page_coverage",
  "route_completeness",
  "navigation_alignment",
  "asset_readiness",
  "seo_coverage",
  "brand_alignment",
  "blueprint_alignment",
  "storefront_composite",
] as const;

export type StorefrontSignalType = (typeof STOREFRONT_SIGNAL_TYPES)[number];

/** Individual factor contributing to storefront assembly scoring. */
export type StorefrontSignal = {
  signalType: StorefrontSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const storefrontSignalSchema = z.object({
  signalType: z.enum(STOREFRONT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a StorefrontSignal record shape. */
export function validateStorefrontSignal(value: unknown): StorefrontSignal {
  return storefrontSignalSchema.parse(value);
}
