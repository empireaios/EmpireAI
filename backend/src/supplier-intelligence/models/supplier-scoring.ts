import { z } from "zod";

/** SUP-004 — Supplier scoring dimensions. */
export const SUPPLIER_SCORE_DIMENSIONS = [
  "shippingTime",
  "processingTime",
  "cost",
  "marginPotential",
  "inventoryStability",
  "countryCoverage",
  "qualityRisk",
  "refundRisk",
  "supplierReliability",
  "scalePotential",
] as const;

export type SupplierScoreDimension = (typeof SUPPLIER_SCORE_DIMENSIONS)[number];

export const supplierScoreBreakdownSchema = z.object({
  dimension: z.enum(SUPPLIER_SCORE_DIMENSIONS),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  rationale: z.string(),
});

export const supplierScoreResultSchema = z.object({
  providerId: z.string(),
  supplierProductId: z.string(),
  overallScore: z.number().min(0).max(100),
  recommendation: z.enum(["LAUNCH", "REVIEW", "HOLD", "REJECT"]),
  breakdown: z.array(supplierScoreBreakdownSchema),
  computedAt: z.string().datetime({ offset: true }),
});

export type SupplierScoreResult = z.infer<typeof supplierScoreResultSchema>;

export const SUPPLIER_SCORE_WEIGHTS: Record<SupplierScoreDimension, number> = {
  shippingTime: 0.12,
  processingTime: 0.08,
  cost: 0.12,
  marginPotential: 0.15,
  inventoryStability: 0.1,
  countryCoverage: 0.1,
  qualityRisk: 0.1,
  refundRisk: 0.08,
  supplierReliability: 0.1,
  scalePotential: 0.05,
};
