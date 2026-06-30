import { z } from "zod";

export const PORTFOLIO_SIGNAL_TYPES = [
  "expected_value",
  "confidence",
  "difficulty",
  "risk_exposure",
  "capital_priority",
  "attention_priority",
  "state_recommendation",
  "portfolio_composite",
] as const;

export type PortfolioSignalType = (typeof PORTFOLIO_SIGNAL_TYPES)[number];

/** Individual factor contributing to portfolio scoring. */
export type PortfolioSignal = {
  signalType: PortfolioSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const portfolioSignalSchema = z.object({
  signalType: z.enum(PORTFOLIO_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a PortfolioSignal record shape. */
export function validatePortfolioSignal(value: unknown): PortfolioSignal {
  return portfolioSignalSchema.parse(value);
}
