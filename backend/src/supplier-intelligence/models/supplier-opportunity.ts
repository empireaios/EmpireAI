import { z } from "zod";

import { supplierScoreResultSchema } from "./supplier-scoring.js";

/** SUP-008 — Supplier opportunity for launch pipeline. */
export const supplierOpportunitySchema = z.object({
  opportunityId: z.string(),
  providerId: z.string(),
  supplierProductId: z.string(),
  title: z.string(),
  category: z.string(),
  score: supplierScoreResultSchema,
  pipelineStatus: z.enum(["FOUND", "UNDER_REVIEW", "CIS_QUEUED", "GKR_QUEUED", "APPROVED", "REJECTED"]),
  targetCountries: z.array(z.string()),
  marginPercent: z.number().min(0).max(100).optional(),
  discoveredAt: z.string().datetime({ offset: true }),
});

export type SupplierOpportunity = z.infer<typeof supplierOpportunitySchema>;
