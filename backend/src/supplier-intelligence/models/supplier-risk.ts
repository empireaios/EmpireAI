import { z } from "zod";

/** SUP-007 — Supplier risk signals. */
export const SUPPLIER_RISK_TYPES = [
  "slow_shipping",
  "unstable_stock",
  "high_refund_risk",
  "poor_country_coverage",
  "bad_margin",
  "compliance_risk",
] as const;

export type SupplierRiskType = (typeof SUPPLIER_RISK_TYPES)[number];

export const supplierRiskSignalSchema = z.object({
  riskId: z.string(),
  riskType: z.enum(SUPPLIER_RISK_TYPES),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  providerId: z.string(),
  supplierProductId: z.string().optional(),
  message: z.string(),
  mitigation: z.string().optional(),
  detectedAt: z.string().datetime({ offset: true }),
});

export type SupplierRiskSignal = z.infer<typeof supplierRiskSignalSchema>;
