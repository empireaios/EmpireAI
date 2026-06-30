import { z } from "zod";

import { STORE_PAGE_TYPES } from "../../store-blueprint/models/store-page.js";

export type GeneratedPageType = (typeof STORE_PAGE_TYPES)[number];

/** A generated page file in the storefront codebase. */
export type GeneratedPage = {
  pageId: string;
  route: string;
  pageType: GeneratedPageType;
  pageName: string;
  filePath: string;
  componentImports: string[];
  sourceCode: string;
};

export const generatedPageSchema = z.object({
  pageId: z.string().min(1),
  route: z.string().min(1),
  pageType: z.enum(STORE_PAGE_TYPES),
  pageName: z.string().min(1),
  filePath: z.string().min(1),
  componentImports: z.array(z.string()).min(1),
  sourceCode: z.string().min(1),
});

/** Validates a GeneratedPage record shape. */
export function validateGeneratedPage(value: unknown): GeneratedPage {
  return generatedPageSchema.parse(value);
}
