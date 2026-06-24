import { z } from "zod";

export const SUPPLIER_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type SupplierRiskLevel = (typeof SUPPLIER_RISK_LEVELS)[number];

/** Supplier risk assessment across operational dimensions. */
export type SupplierRiskProfile = {
  riskLevel: SupplierRiskLevel;
  disputeRisk: number;
  shippingRisk: number;
  qualityRisk: number;
  fraudRisk: number;
};

export const supplierRiskProfileSchema = z.object({
  riskLevel: z.enum(SUPPLIER_RISK_LEVELS),
  disputeRisk: z.number().min(0).max(100),
  shippingRisk: z.number().min(0).max(100),
  qualityRisk: z.number().min(0).max(100),
  fraudRisk: z.number().min(0).max(100),
});

/** Validates a SupplierRiskProfile record shape. */
export function validateSupplierRiskProfile(value: unknown): SupplierRiskProfile {
  return supplierRiskProfileSchema.parse(value);
}

/** Maps an average risk score to a risk level label. */
export function resolveSupplierRiskLevel(averageRisk: number): SupplierRiskLevel {
  if (averageRisk >= 75) return "critical";
  if (averageRisk >= 55) return "high";
  if (averageRisk >= 35) return "medium";
  return "low";
}
