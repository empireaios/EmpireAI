import { z } from "zod";

export const simulationScenarioSchema = z.object({
  scenario: z.enum(["BEST_CASE", "EXPECTED", "WORST_CASE"]),
  revenueUsd: z.number(),
  profitUsd: z.number(),
  riskScore: z.number().min(0).max(100),
  supplierRisk: z.string(),
  shippingRisk: z.string(),
  marketplaceRisk: z.string(),
  countryRisk: z.string(),
  advertisingCostUsd: z.number(),
  evidence: z.string(),
});

export const globalRevenueSimulationDashboardSchema = z.object({
  moduleId: z.literal("global-revenue-simulation"),
  missionId: z.literal("REAL-030"),
  workspaceId: z.string(),
  companyId: z.string(),
  scenarios: z.array(simulationScenarioSchema),
  sensitivityAnalysis: z.array(z.object({ variable: z.string(), impactPercent: z.number() })),
  executiveRecommendation: z.string(),
  recommendationEvidence: z.string(),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type SimulationScenario = z.infer<typeof simulationScenarioSchema>;
export type GlobalRevenueSimulationDashboard = z.infer<typeof globalRevenueSimulationDashboardSchema>;
