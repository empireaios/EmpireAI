import { z } from "zod";

export const STORE_PAGE_CONTENT_SECTION_TYPES = [
  "HERO",
  "BODY",
  "BULLETS",
  "PRODUCT_GRID",
  "FAQ",
  "CTA",
  "CONTACT",
] as const;

export type StorePageContentSectionType = (typeof STORE_PAGE_CONTENT_SECTION_TYPES)[number];

/** A content section within a renderable store page. */
export type StorePageContent = {
  sectionId: string;
  sectionType: StorePageContentSectionType;
  headline: string;
  body: string;
  bullets: string[];
  callToAction: string | null;
  order: number;
};

export const storePageContentSchema = z.object({
  sectionId: z.string().min(1),
  sectionType: z.enum(STORE_PAGE_CONTENT_SECTION_TYPES),
  headline: z.string().min(1),
  body: z.string().min(1),
  bullets: z.array(z.string()),
  callToAction: z.string().nullable(),
  order: z.number().int().min(0),
});

/** Validates a StorePageContent record shape. */
export function validateStorePageContent(value: unknown): StorePageContent {
  return storePageContentSchema.parse(value);
}
