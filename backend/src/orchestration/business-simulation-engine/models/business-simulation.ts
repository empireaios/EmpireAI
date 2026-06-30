import { z } from "zod";

import {
  executionTraceSchema,
  explainableRecommendationSchema,
} from "../../ecommerce-os-orchestrator/models/execution-doctrine.js";

export const SIMULATION_LAUNCH_RECOMMENDATIONS = [
  "DO_NOT_LAUNCH",
  "LAUNCH_WITH_CAUTION",
  "READY_FOR_LAUNCH",
  "HIGH_PRIORITY_LAUNCH",
] as const;

export type SimulationLaunchRecommendation = (typeof SIMULATION_LAUNCH_RECOMMENDATIONS)[number];

export const SCENARIO_HORIZONS = ["30_DAYS", "90_DAYS", "12_MONTHS"] as const;
export type ScenarioHorizon = (typeof SCENARIO_HORIZONS)[number];
export const SCENARIO_CASES = ["BEST_CASE", "EXPECTED_CASE", "WORST_CASE"] as const;
export type ScenarioCase = (typeof SCENARIO_CASES)[number];

export const financialForecastSchema = z.object({
  projectedRevenue: z.number().min(0),
  projectedGrossProfit: z.number(),
  projectedNetProfit: z.number(),
  breakEvenPointMonths: z.number().min(0),
  cashflowProjection: z.array(z.object({
    month: z.number().int().min(1),
    revenue: z.number(),
    costs: z.number(),
    netCashflow: z.number(),
  })),
  marginAnalysis: z.object({
    grossMarginPercent: z.number(),
    netMarginPercent: z.number(),
    cogsPercent: z.number(),
  }),
});

export const commercialForecastSchema = z.object({
  conversionRateEstimate: z.number().min(0).max(100),
  clickThroughEstimate: z.number().min(0).max(100),
  expectedOrders: z.number().int().min(0),
  expectedRefundRate: z.number().min(0).max(100),
  expectedReturnRate: z.number().min(0).max(100),
});

export const scenarioProjectionSchema = z.object({
  horizon: z.enum(SCENARIO_HORIZONS),
  case: z.enum(SCENARIO_CASES),
  revenue: z.number().min(0),
  grossProfit: z.number(),
  netProfit: z.number(),
  orders: z.number().int().min(0),
});

export const simulationRiskAnalysisSchema = z.object({
  financialRisk: z.number().int().min(0).max(100),
  operationalRisk: z.number().int().min(0).max(100),
  supplierRisk: z.number().int().min(0).max(100),
  marketplaceRisk: z.number().int().min(0).max(100),
  customerRisk: z.number().int().min(0).max(100),
  brandRisk: z.number().int().min(0).max(100),
  overallRisk: z.number().int().min(0).max(100),
  riskNotes: z.array(z.string()),
});

export const capitalProtectionSchema = z.object({
  doctrineReference: z.string().min(1),
  executionDoctrineReference: z.string().min(1),
  minimumRecommendedCapital: z.number().min(0),
  monthlyOperatingRequirement: z.number().min(0),
  configuredCapitalConstraint: z.number().min(0),
  expectedPaybackPeriodMonths: z.number().min(0),
  capitalBlocked: z.boolean(),
  blockingReason: z.string().optional(),
});

export const simulationRecommendationSchema = z.object({
  recommendation: z.enum(SIMULATION_LAUNCH_RECOMMENDATIONS),
  reasoning: z.string().min(1),
});

export const businessSimulationRecordSchema = z.object({
  simulationId: z.string().min(1),
  buildId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  strategyId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessName: z.string().min(1),
  financialForecast: financialForecastSchema,
  commercialForecast: commercialForecastSchema,
  scenarioAnalysis: z.array(scenarioProjectionSchema),
  riskAnalysis: simulationRiskAnalysisSchema,
  capitalProtection: capitalProtectionSchema,
  finalRecommendation: simulationRecommendationSchema,
  explainability: explainableRecommendationSchema,
  executionTrace: executionTraceSchema,
  simulationScore: z.number().int().min(0).max(100),
  simulationConfidence: z.number().int().min(0).max(100),
  simulatedAt: z.string().datetime({ offset: true }),
});

export type BusinessSimulationRecord = z.infer<typeof businessSimulationRecordSchema>;
export type FinancialForecast = z.infer<typeof financialForecastSchema>;
export type CommercialForecast = z.infer<typeof commercialForecastSchema>;
export type ScenarioProjection = z.infer<typeof scenarioProjectionSchema>;
export type SimulationRiskAnalysis = z.infer<typeof simulationRiskAnalysisSchema>;
export type CapitalProtection = z.infer<typeof capitalProtectionSchema>;
export type SimulationRecommendation = z.infer<typeof simulationRecommendationSchema>;

export const businessSimulationComparisonSchema = z.object({
  simulationA: businessSimulationRecordSchema,
  simulationB: businessSimulationRecordSchema,
  highlights: z.object({
    higherScore: z.enum(["A", "B", "TIE"]),
    higherProfit: z.enum(["A", "B", "TIE"]),
    lowerRisk: z.enum(["A", "B", "TIE"]),
    strongerRecommendation: z.enum(["A", "B", "TIE"]),
    betterCapitalFit: z.enum(["A", "B", "TIE"]),
  }),
  summary: z.string().min(1),
});

export type BusinessSimulationComparison = z.infer<typeof businessSimulationComparisonSchema>;

export const businessSimulationDashboardSchema = z.object({
  businessSimulationScore: z.number().int().min(0).max(100),
  projectedProfit: z.number(),
  projectedCashflow: z.number(),
  projectedBreakEven: z.number().min(0),
  launchRecommendation: z.enum(SIMULATION_LAUNCH_RECOMMENDATIONS).optional(),
  simulationConfidence: z.number().int().min(0).max(100),
  latestSimulationId: z.string().optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type BusinessSimulationDashboard = z.infer<typeof businessSimulationDashboardSchema>;

export const businessSimulationSummarySchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  totalSimulations: z.number().int().min(0),
  readyForLaunch: z.number().int().min(0),
  highPriorityLaunch: z.number().int().min(0),
  doNotLaunch: z.number().int().min(0),
  averageSimulationScore: z.number().min(0).max(100),
  topSimulation: businessSimulationRecordSchema.optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type BusinessSimulationSummary = z.infer<typeof businessSimulationSummarySchema>;
