import { z } from "zod";

export const STORE_PAGE_TYPES = [
  "HOME",
  "COLLECTION",
  "PRODUCT",
  "ABOUT",
  "FAQ",
  "CONTACT",
] as const;

export type StorePageType = (typeof STORE_PAGE_TYPES)[number];

/** A single page within a store blueprint. */
export type StorePage = {
  pageId: string;
  pageType: StorePageType;
  slug: string;
  title: string;
  headline: string;
  summary: string;
  body: string;
  bullets: string[];
  productIds: string[];
  order: number;
};

export const storePageSchema = z.object({
  pageId: z.string().min(1),
  pageType: z.enum(STORE_PAGE_TYPES),
  slug: z.string().min(1),
  title: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().min(1),
  bullets: z.array(z.string()),
  productIds: z.array(z.string()),
  order: z.number().int().min(0),
});

/** Validates a StorePage record shape. */
export function validateStorePage(value: unknown): StorePage {
  return storePageSchema.parse(value);
}
