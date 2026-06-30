import { z } from "zod";

export const RISK_SEVERITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

/** Risk scenario for financial forecast. */
export type RiskScenario = {
  riskId: string;
  riskName: string;
  severity: RiskSeverity;
  description: string;
  revenueImpactPercent: number;
  probabilityPercent: number;
  mitigation: string;
  score: number;
};

export const riskScenarioSchema = z.object({
  riskId: z.string().min(1),
  riskName: z.string().min(1),
  severity: z.enum(RISK_SEVERITIES),
  description: z.string().min(1),
  revenueImpactPercent: z.number().min(0).max(100),
  probabilityPercent: z.number().min(0).max(100),
  mitigation: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a RiskScenario record shape. */
export function validateRiskScenario(value: unknown): RiskScenario {
  return riskScenarioSchema.parse(value);
}
