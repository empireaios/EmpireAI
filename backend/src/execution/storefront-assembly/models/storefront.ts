import { z } from "zod";

import { storeNavigationSchema, type StoreNavigation } from "../../store-blueprint/models/store-navigation.js";
import { storePageMetadataSchema, type StorePageMetadata } from "../../store-page-generation/models/renderable-store-page.js";
import {
  storefrontSignalSchema,
  type StorefrontSignal,
} from "./storefront-signal.js";
import { storefrontRouteSchema, type StorefrontRoute } from "./storefront-route.js";
import { storefrontAssetSchema, type StorefrontAsset } from "./storefront-asset.js";

export type StorefrontId = string;

/** Complete deployable storefront structure assembled from pages, blueprint, and brand. */
export type Storefront = {
  storefrontId: StorefrontId;
  workspaceId: string;
  storeId: string;
  brandId: string;
  routes: StorefrontRoute[];
  navigation: StoreNavigation;
  assets: StorefrontAsset[];
  pageMap: Record<string, string>;
  seoMap: Record<string, StorePageMetadata>;
  confidence: number;
  signals: StorefrontSignal[];
  createdAt: string;
  updatedAt: string;
};

export type StorefrontCreateInput = Omit<
  Storefront,
  "storefrontId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const storefrontSchema = z.object({
  storefrontId: z.string().min(1),
  workspaceId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  routes: z.array(storefrontRouteSchema).min(1),
  navigation: storeNavigationSchema,
  assets: z.array(storefrontAssetSchema).min(1),
  pageMap: z.record(z.string(), z.string()),
  seoMap: z.record(z.string(), storePageMetadataSchema),
  confidence: z.number().min(0).max(100),
  signals: z.array(storefrontSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a Storefront record shape. */
export function validateStorefront(value: unknown): Storefront {
  return storefrontSchema.parse(value);
}
