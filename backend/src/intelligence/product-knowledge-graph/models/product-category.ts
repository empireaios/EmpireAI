import { z } from "zod";

export type ProductCategoryId = string;

/** Hierarchical product category node. */
export type ProductCategory = {
  id: ProductCategoryId;
  workspaceId: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  path: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductCategoryCreateInput = Omit<
  ProductCategory,
  "id" | "workspaceId" | "path" | "createdAt" | "updatedAt"
> & {
  path?: string[];
};

export type ProductCategoryUpdateInput = Partial<ProductCategoryCreateInput>;

const isoTimestamp = z.string().datetime({ offset: true });

export const productCategorySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  parentCategoryId: z.string().optional(),
  path: z.array(z.string()),
  description: z.string().optional(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ProductCategory record shape. */
export function validateProductCategory(value: unknown): ProductCategory {
  return productCategorySchema.parse(value);
}

/** Normalizes a category slug for stable hierarchy keys. */
export function normalizeProductCategorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
