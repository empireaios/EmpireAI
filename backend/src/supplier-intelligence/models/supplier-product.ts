import { z } from "zod";

/** SUP-002 — Supplier product model (input data — EmpireAI Intelligence decides). */
export const supplierProductVariantSchema = z.object({
  variantId: z.string(),
  sku: z.string().optional(),
  title: z.string().optional(),
  price: z.number().nonnegative(),
  inventory: z.number().int().nonnegative().optional(),
  attributes: z.record(z.string()).default({}),
});

export const supplierProductSchema = z.object({
  supplierProductId: z.string().min(1),
  providerId: z.string().min(1),
  supplierName: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative(),
  suggestedRetailPrice: z.number().nonnegative().optional(),
  variants: z.array(supplierProductVariantSchema).default([]),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  specs: z.record(z.string()).default({}),
  inventory: z.number().int().nonnegative().default(0),
  warehouse: z.string().optional(),
  shippingCountries: z.array(z.string()).default([]),
  processingDays: z.number().int().nonnegative().optional(),
  shippingDaysMin: z.number().int().nonnegative().optional(),
  shippingDaysMax: z.number().int().nonnegative().optional(),
  supplierRating: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).default([]),
  sourceUrl: z.string().optional(),
  dataAuthority: z.literal("supplier_input").default("supplier_input"),
  ingestedAt: z.string().datetime({ offset: true }),
});

export type SupplierProduct = z.infer<typeof supplierProductSchema>;
export type SupplierProductVariant = z.infer<typeof supplierProductVariantSchema>;

export const SUPPLIER_PRODUCT_TRACKED_FIELDS = [
  "supplierProductId", "title", "category", "price", "variants", "images", "videos",
  "specs", "inventory", "warehouse", "shippingCountries", "processingDays", "shippingDays",
  "supplierRating",
] as const;
