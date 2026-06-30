import { z } from "zod";

export const REFUNDS_HEALTH_STATUSES = ["HEALTHY", "WARNING", "CRITICAL"] as const;

export type RefundsHealthStatus = (typeof REFUNDS_HEALTH_STATUSES)[number];

/** Refunds health monitor snapshot. */
export type RefundsHealth = {
  monitorId: string;
  refundRatePercent: number;
  refundCount: number;
  refundTotal: number;
  targetRefundRatePercent: number;
  topReason: string;
  status: RefundsHealthStatus;
  currency: string;
  score: number;
  summary: string;
};

export const refundsHealthSchema = z.object({
  monitorId: z.string().min(1),
  refundRatePercent: z.number().min(0).max(100),
  refundCount: z.number().int().min(0),
  refundTotal: z.number().min(0),
  targetRefundRatePercent: z.number().min(0).max(100),
  topReason: z.string().min(1),
  status: z.enum(REFUNDS_HEALTH_STATUSES),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a RefundsHealth record shape. */
export function validateRefundsHealth(value: unknown): RefundsHealth {
  return refundsHealthSchema.parse(value);
}
