/** X2-14 — Risk Forecast Engine. */

import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type { ForecastPeriod } from "./types.js";

export class RiskForecastEngine {
  forecastRisk(input: {
    growthForecast: number;
    capitalRequirementForecast: number;
    companyCount: number;
    forecastPeriod: ForecastPeriod;
    config: PortfolioForecastEngineConfiguration;
    riskSignalPresent: boolean;
  }): { riskForecast: number; confidenceScore: number } {
    let risk = 35;
    if (input.growthForecast > 20) risk += 12;
    if (input.capitalRequirementForecast > 500_000) risk += 10;
    if (input.companyCount <= 1) risk += 8;
    if (input.forecastPeriod === "365d") risk += 6;
    if (!input.riskSignalPresent) risk += 10;
    const riskForecast = Math.max(5, Math.min(95, Math.round(risk)));
    const confidenceScore = Math.min(
      88,
      Math.max(
        input.config.minimumConfidenceThreshold,
        input.riskSignalPresent ? 72 : 50,
      ),
    );
    return { riskForecast, confidenceScore };
  }
}
