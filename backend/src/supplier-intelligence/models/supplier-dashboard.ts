import { z } from "zod";

import { supplierOpportunitySchema } from "./supplier-opportunity.js";
import { supplierRiskSignalSchema } from "./supplier-risk.js";
import { cjAccessReadinessSchema } from "../../operational-access/models/platform-readiness.js";

/** SUP-011 — Supplier Intelligence Dashboard. */
export const supplierDashboardSchema = z.object({
  moduleId: z.literal("supplier-intelligence"),
  missionId: z.literal("SUP-011"),
  workspaceId: z.string(),
  companyId: z.string(),
  architectureComplete: z.boolean(),
  architecturePercent: z.number().min(0).max(100),
  productsFound: z.number().int(),
  productsUnderReview: z.number().int(),
  supplierRisks: z.array(supplierRiskSignalSchema),
  bestOpportunities: z.array(supplierOpportunitySchema),
  cjReadiness: cjAccessReadinessSchema,
  shippingRiskCount: z.number().int(),
  countryCoverageSummary: z.array(z.object({
    country: z.string(),
    supplierCount: z.number().int(),
  })),
  adapterSummary: z.object({
    total: z.number().int(),
    architectureReady: z.number().int(),
    connected: z.number().int(),
  }),
  highestPriorityAction: z.object({
    action: z.string(),
    reason: z.string(),
  }).nullable(),
  computedAt: z.string().datetime({ offset: true }),
});

export type SupplierDashboard = z.infer<typeof supplierDashboardSchema>;
