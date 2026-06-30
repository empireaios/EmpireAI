import { z } from "zod";

import { supplierScoreResultSchema } from "./supplier-scoring.js";
import { shippingAcceptabilityResultSchema } from "./shipping-acceptability.js";

/** SUP-006 — Multi-supplier comparison for one product idea. */
export const supplierComparisonEntrySchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  supplierProductId: z.string(),
  title: z.string(),
  costPrice: z.number(),
  score: supplierScoreResultSchema,
  shipping: shippingAcceptabilityResultSchema,
  rank: z.number().int().positive(),
});

export const supplierComparisonResultSchema = z.object({
  productIdea: z.string(),
  targetCountry: z.string(),
  entries: z.array(supplierComparisonEntrySchema),
  recommendedProviderId: z.string(),
  recommendedSupplierProductId: z.string(),
  rationale: z.string(),
  computedAt: z.string().datetime({ offset: true }),
});

export type SupplierComparisonResult = z.infer<typeof supplierComparisonResultSchema>;
