import { z } from "zod";

import { brandIdentitySchema, type BrandIdentity } from "./brand-identity.js";
import { brandPositioningSchema, type BrandPositioning } from "./brand-positioning.js";

export type BrandProfileId = string;

/** Generated brand profile for pursuing a revenue opportunity. */
export type BrandProfile = {
  brandId: BrandProfileId;
  workspaceId: string;
  opportunityId: string;
  productId: string;
  portfolioEntryId: string | null;
  allocationId: string | null;
  brandName: string;
  slogan: string;
  niche: string;
  targetAudience: string;
  positioning: string;
  valueProposition: string;
  recommendedProducts: string[];
  confidence: number;
  identity: BrandIdentity;
  positioningProfile: BrandPositioning;
  createdAt: string;
  updatedAt: string;
};

export type BrandProfileCreateInput = Omit<
  BrandProfile,
  "brandId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const brandProfileSchema = z.object({
  brandId: z.string().min(1),
  workspaceId: z.string().min(1),
  opportunityId: z.string().min(1),
  productId: z.string().min(1),
  portfolioEntryId: z.string().nullable(),
  allocationId: z.string().nullable(),
  brandName: z.string().min(1),
  slogan: z.string().min(1),
  niche: z.string().min(1),
  targetAudience: z.string().min(1),
  positioning: z.string().min(1),
  valueProposition: z.string().min(1),
  recommendedProducts: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(100),
  identity: brandIdentitySchema,
  positioningProfile: brandPositioningSchema,
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a BrandProfile record shape. */
export function validateBrandProfile(value: unknown): BrandProfile {
  return brandProfileSchema.parse(value);
}
