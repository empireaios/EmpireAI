import { z } from "zod";

export const TRADEOFF_DIMENSIONS = [
  "COST",
  "SPEED",
  "RISK",
  "QUALITY",
  "SCALE",
  "REVENUE",
] as const;

export type TradeoffDimension = (typeof TRADEOFF_DIMENSIONS)[number];

/** Tradeoff analysis between decision options. */
export type DecisionTradeoff = {
  tradeoffId: string;
  dimension: TradeoffDimension;
  chosenOption: string;
  rejectedOption: string;
  benefit: string;
  cost: string;
  netImpact: string;
  score: number;
};

export const decisionTradeoffSchema = z.object({
  tradeoffId: z.string().min(1),
  dimension: z.enum(TRADEOFF_DIMENSIONS),
  chosenOption: z.string().min(1),
  rejectedOption: z.string().min(1),
  benefit: z.string().min(1),
  cost: z.string().min(1),
  netImpact: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a DecisionTradeoff record shape. */
export function validateDecisionTradeoff(value: unknown): DecisionTradeoff {
  return decisionTradeoffSchema.parse(value);
}
