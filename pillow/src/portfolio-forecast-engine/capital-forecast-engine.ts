/** X2-14 — Capital Forecast Engine. */

import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type { ForecastPeriod } from "./types.js";

function periodMonths(period: ForecastPeriod): number {
  switch (period) {
    case "30d":
      return 1;
    case "90d":
      return 3;
    case "180d":
      return 6;
    case "365d":
      return 12;
  }
}

export class CapitalForecastEngine {
  forecastCapital(input: {
    baselineRevenue: number;
    growthForecast: number;
    companyCount: number;
    forecastPeriod: ForecastPeriod;
    config: PortfolioForecastEngineConfiguration;
    capitalSignalPresent: boolean;
  }): { capitalRequirementForecast: number; confidenceScore: number } {
    const months = periodMonths(input.forecastPeriod);
    const workingCapitalRatio = input.capitalSignalPresent ? 0.12 : 0.18;
    const growthUplift = 1 + input.growthForecast / 100;
    const capitalRequirementForecast = Math.round(
      input.baselineRevenue *
        workingCapitalRatio *
        (months / 12) *
        growthUplift *
        Math.max(1, input.companyCount * 0.35),
    );
    const confidenceScore = Math.min(
      90,
      Math.max(
        input.config.minimumConfidenceThreshold,
        input.capitalSignalPresent ? 70 : 50,
      ),
    );
    return { capitalRequirementForecast, confidenceScore };
  }
}
