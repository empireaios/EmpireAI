import { z } from "zod";

import { breakevenAnalysisSchema, type BreakevenAnalysis } from "./breakeven-analysis.js";
import { cashFlowForecastSchema, type CashFlowForecast } from "./cash-flow-forecast.js";
import {
  financialForecastSignalSchema,
  type FinancialForecastSignal,
} from "./financial-forecast-signal.js";
import { growthScenarioSchema, type GrowthScenario } from "./growth-scenario.js";
import { profitForecastSchema, type ProfitForecast } from "./profit-forecast.js";
import { revenueForecastSchema, type RevenueForecast } from "./revenue-forecast.js";
import { riskScenarioSchema, type RiskScenario } from "./risk-scenario.js";
import { roasForecastSchema, type RoasForecast } from "./roas-forecast.js";

export type FinancialForecastReportId = string;

/** Complete financial forecast report — intelligence only, no deployment. */
export type FinancialForecastReport = {
  reportId: FinancialForecastReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  revenue: RevenueForecast;
  profit: ProfitForecast;
  roas: RoasForecast;
  cashFlow: CashFlowForecast;
  breakeven: BreakevenAnalysis;
  growthScenarios: GrowthScenario[];
  riskScenarios: RiskScenario[];
  overallScore: number;
  confidence: number;
  signals: FinancialForecastSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoApplyEnabled: false;
};

export type FinancialForecastReportCreateInput = Omit<FinancialForecastReport, "reportId">;

export const financialForecastReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  revenue: revenueForecastSchema,
  profit: profitForecastSchema,
  roas: roasForecastSchema,
  cashFlow: cashFlowForecastSchema,
  breakeven: breakevenAnalysisSchema,
  growthScenarios: z.array(growthScenarioSchema).length(3),
  riskScenarios: z.array(riskScenarioSchema).min(1),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(financialForecastSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoApplyEnabled: z.literal(false),
});

/** Validates a FinancialForecastReport record shape. */
export function validateFinancialForecastReport(value: unknown): FinancialForecastReport {
  return financialForecastReportSchema.parse(value);
}
