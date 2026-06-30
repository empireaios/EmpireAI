import { z } from "zod";

export const SCENARIO_TYPES = ["CONSERVATIVE", "BASE", "AGGRESSIVE"] as const;

export type ScenarioType = (typeof SCENARIO_TYPES)[number];

/** Growth scenario forecast. */
export type GrowthScenario = {
  scenarioId: string;
  scenarioType: ScenarioType;
  label: string;
  revenueMultiplier: number;
  projectedAnnualRevenue: number;
  projectedAnnualProfit: number;
  growthRatePercent: number;
  assumptions: string[];
  score: number;
};

export const growthScenarioSchema = z.object({
  scenarioId: z.string().min(1),
  scenarioType: z.enum(SCENARIO_TYPES),
  label: z.string().min(1),
  revenueMultiplier: z.number().min(0),
  projectedAnnualRevenue: z.number().min(0),
  projectedAnnualProfit: z.number(),
  growthRatePercent: z.number(),
  assumptions: z.array(z.string().min(1)).min(1),
  score: z.number().min(0).max(100),
});

/** Validates a GrowthScenario record shape. */
export function validateGrowthScenario(value: unknown): GrowthScenario {
  return growthScenarioSchema.parse(value);
}
