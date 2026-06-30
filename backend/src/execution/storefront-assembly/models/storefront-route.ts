import { z } from "zod";

import { STORE_PAGE_TYPES } from "../../store-blueprint/models/store-page.js";

export type StorePageType = (typeof STORE_PAGE_TYPES)[number];

/** A deployable route within an assembled storefront. */
export type StorefrontRoute = {
  routeId: string;
  path: string;
  pageId: string;
  pageType: StorePageType;
  title: string;
  priority: number;
  isDynamic: boolean;
};

export const storefrontRouteSchema = z.object({
  routeId: z.string().min(1),
  path: z.string().min(1),
  pageId: z.string().min(1),
  pageType: z.enum(STORE_PAGE_TYPES),
  title: z.string().min(1),
  priority: z.number().int().min(0),
  isDynamic: z.boolean(),
});

/** Validates a StorefrontRoute record shape. */
export function validateStorefrontRoute(value: unknown): StorefrontRoute {
  return storefrontRouteSchema.parse(value);
}
