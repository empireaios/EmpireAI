import { z } from "zod";

/** Supplier lead time estimate for replenishment planning. */
export type LeadTimeEstimate = {
  estimateId: string;
  supplierName: string;
  averageDays: number;
  minDays: number;
  maxDays: number;
  reliabilityPercent: number;
  score: number;
};

export const leadTimeEstimateSchema = z.object({
  estimateId: z.string().min(1),
  supplierName: z.string().min(1),
  averageDays: z.number().min(0),
  minDays: z.number().min(0),
  maxDays: z.number().min(0),
  reliabilityPercent: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

/** Validates a LeadTimeEstimate record shape. */
export function validateLeadTimeEstimate(value: unknown): LeadTimeEstimate {
  return leadTimeEstimateSchema.parse(value);
}
