import { z } from "zod";

export const STATIC_AD_FORMATS = ["SQUARE", "PORTRAIT", "LANDSCAPE"] as const;

export type StaticAdFormat = (typeof STATIC_AD_FORMATS)[number];

export const staticAdFormatSchema = z.enum(STATIC_AD_FORMATS);

/** Static ad creative blueprint variant. */
export type StaticAdCreative = {
  creativeId: string;
  format: StaticAdFormat;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  visualBrief: string;
};

export const staticAdCreativeSchema = z.object({
  creativeId: z.string().min(1),
  format: staticAdFormatSchema,
  headline: z.string().min(1),
  primaryText: z.string().min(1),
  description: z.string().min(1),
  callToAction: z.string().min(1),
  visualBrief: z.string().min(1),
});

/** Validates a StaticAdCreative record shape. */
export function validateStaticAdCreative(value: unknown): StaticAdCreative {
  return staticAdCreativeSchema.parse(value);
}

/** Aspect ratio label for a static ad format. */
export function staticAdFormatAspectRatio(format: StaticAdFormat): string {
  const ratios: Record<StaticAdFormat, string> = {
    SQUARE: "1:1",
    PORTRAIT: "4:5",
    LANDSCAPE: "16:9",
  };
  return ratios[format];
}
