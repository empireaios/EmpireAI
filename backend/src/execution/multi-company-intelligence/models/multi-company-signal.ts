import { z } from "zod";

export const MULTI_COMPANY_SIGNAL_TYPES = [
  "company_coverage",
  "cross_learning",
  "cross_brand_synergy",
  "portfolio_health",
  "revenue_diversification",
  "multi_company_composite",
] as const;

export type MultiCompanySignalType = (typeof MULTI_COMPANY_SIGNAL_TYPES)[number];

/** Scoring signal for multi-company intelligence confidence. */
export type MultiCompanySignal = {
  signalType: MultiCompanySignalType;
  score: number;
  weight: number;
  detail: string;
};

export const multiCompanySignalSchema = z.object({
  signalType: z.enum(MULTI_COMPANY_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a MultiCompanySignal record shape. */
export function validateMultiCompanySignal(value: unknown): MultiCompanySignal {
  return multiCompanySignalSchema.parse(value);
}
