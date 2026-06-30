import { z } from "zod";

/** Visual and naming identity for a generated brand. */
export type BrandIdentity = {
  brandName: string;
  slogan: string;
  niche: string;
};

export const brandIdentitySchema = z.object({
  brandName: z.string().min(1),
  slogan: z.string().min(1),
  niche: z.string().min(1),
});

/** Validates a BrandIdentity record shape. */
export function validateBrandIdentity(value: unknown): BrandIdentity {
  return brandIdentitySchema.parse(value);
}
