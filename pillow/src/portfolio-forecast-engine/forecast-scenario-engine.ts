/** X2-14 — Forecast Scenario Engine. */

import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type { ForecastPeriod, ForecastRecord, ForecastScenario, ScenarioType } from "./types.js";

const SCENARIO_MULTIPLIERS: Record<
  ScenarioType,
  { revenue: number; profit: number; growth: number; risk: number; confidence: number }
> = {
  base: { revenue: 1, profit: 1, growth: 1, risk: 1, confidence: 1 },
  optimistic: { revenue: 1.18, profit: 1.22, growth: 1.35, risk: 0.75, confidence: 0.85 },
  conservative: { revenue: 0.88, profit: 0.82, growth: 0.7, risk: 1.15, confidence: 0.95 },
  stress: { revenue: 0.65, profit: 0.5, growth: 0.35, risk: 1.55, confidence: 0.7 },
};

export class ForecastScenarioEngine {
  generateScenarios(input: {
    base: ForecastRecord;
    config: PortfolioForecastEngineConfiguration;
  }): ForecastScenario[] {
    if (!input.config.scenarioGenerationRulesEnabled) return [];

    const types: ScenarioType[] = ["base", "optimistic", "conservative", "stress"];
    return types.map((scenarioType) => {
      const m = SCENARIO_MULTIPLIERS[scenarioType];
      return {
        scenarioId: `pfe-scn-${Date.now()}-${scenarioType}`,
        timestamp: new Date().toISOString(),
        scenarioType,
        portfolioReference: input.base.portfolioReference,
        forecastPeriod: input.base.forecastPeriod,
        revenueForecast: Math.round(input.base.revenueForecast * m.revenue),
        profitForecast: Math.round(input.base.profitForecast * m.profit),
        growthForecast: Math.round(input.base.growthForecast * m.growth),
        riskForecast: Math.max(1, Math.min(100, Math.round(input.base.riskForecast * m.risk))),
        confidenceScore: Math.max(
          input.config.minimumConfidenceThreshold,
          Math.min(95, Math.round(input.base.confidenceScore * m.confidence)),
        ),
        rationale: `Structural ${scenarioType} scenario — not a guaranteed outcome`,
        notGuaranteedOutcome: true,
        structuralSignalOnly: true,
      };
    });
  }

  buildExecutiveForecast(input: {
    base: ForecastRecord;
    scenarios: ForecastScenario[];
    forecastPeriod: ForecastPeriod;
  }): ForecastRecord {
    const optimistic = input.scenarios.find((s) => s.scenarioType === "optimistic");
    const conservative = input.scenarios.find((s) => s.scenarioType === "conservative");
    const blendedRevenue = Math.round(
      (input.base.revenueForecast +
        (optimistic?.revenueForecast ?? input.base.revenueForecast) +
        (conservative?.revenueForecast ?? input.base.revenueForecast)) /
        3,
    );
    const blendedProfit = Math.round(
      (input.base.profitForecast +
        (optimistic?.profitForecast ?? input.base.profitForecast) +
        (conservative?.profitForecast ?? input.base.profitForecast)) /
        3,
    );
    return {
      ...input.base,
      forecastId: `pfe-fc-${Date.now()}-exec`,
      timestamp: new Date().toISOString(),
      forecastPeriod: input.forecastPeriod,
      revenueForecast: blendedRevenue,
      profitForecast: blendedProfit,
      confidenceScore: Math.max(
        40,
        Math.min(90, Math.round(input.base.confidenceScore * 0.92)),
      ),
      notGuaranteedOutcome: true,
      structuralSignalOnly: true,
      sensitiveEnterpriseData: false,
    };
  }
}
