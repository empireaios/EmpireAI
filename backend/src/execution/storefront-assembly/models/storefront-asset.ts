import { z } from "zod";

export const STOREFRONT_ASSET_TYPES = [
  "LOGO",
  "FAVICON",
  "THEME",
  "STYLE",
  "SCRIPT",
  "IMAGE",
] as const;

export type StorefrontAssetType = (typeof STOREFRONT_ASSET_TYPES)[number];

/** A deployable asset required by an assembled storefront. */
export type StorefrontAsset = {
  assetId: string;
  assetType: StorefrontAssetType;
  name: string;
  path: string;
  mimeType: string;
};

export const storefrontAssetSchema = z.object({
  assetId: z.string().min(1),
  assetType: z.enum(STOREFRONT_ASSET_TYPES),
  name: z.string().min(1),
  path: z.string().min(1),
  mimeType: z.string().min(1),
});

/** Validates a StorefrontAsset record shape. */
export function validateStorefrontAsset(value: unknown): StorefrontAsset {
  return storefrontAssetSchema.parse(value);
}
