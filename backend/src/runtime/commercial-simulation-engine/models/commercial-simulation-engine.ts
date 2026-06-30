import { z } from "zod";

export const SIMULATION_SCENARIOS = [
  "before_launch",
  "expansion",
  "supplier_switch",
  "pricing_change",
] as const;

export const scenarioResultSchema = z.object({
  scenario: z.enum(SIMULATION_SCENARIOS),
  label: z.string(),
  projectedProfitUsd: z.number(),
  projectedRevenueUsd: z.number(),
  breakEvenMonths: z.number(),
  confidence: z.number(),
  recommendation: z.string(),
  evidence: z.string(),
});

export const commercialSimulationEngineSchema = z.object({
  moduleId: z.literal("commercial-simulation-engine"),
  missionId: z.literal("REAL-064"),
  workspaceId: z.string(),
  companyId: z.string(),
  simulationSummary: z.object({
    businessSimulationScore: z.number(),
    projectedProfit: z.number(),
    projectedCashflow: z.number(),
    projectedBreakEven: z.number(),
    simulationConfidence: z.number(),
    launchRecommendation: z.string().optional(),
  }),
  scenarios: z.array(scenarioResultSchema),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type SimulationScenario = (typeof SIMULATION_SCENARIOS)[number];
export type CommercialSimulationEngine = z.infer<typeof commercialSimulationEngineSchema>;
