import { z } from "zod";

/** Market positioning for a generated brand. */
export type BrandPositioning = {
  targetAudience: string;
  positioning: string;
  valueProposition: string;
  recommendedProducts: string[];
};

export const brandPositioningSchema = z.object({
  targetAudience: z.string().min(1),
  positioning: z.string().min(1),
  valueProposition: z.string().min(1),
  recommendedProducts: z.array(z.string()).min(1),
});

/** Validates a BrandPositioning record shape. */
export function validateBrandPositioning(value: unknown): BrandPositioning {
  return brandPositioningSchema.parse(value);
}
