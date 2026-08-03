/** X2-14 — Revenue Forecast Engine (revenue + profit). */

import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type { ForecastPeriod } from "./types.js";

function periodMultiplier(period: ForecastPeriod): number {
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

export class RevenueForecastEngine {
  forecastRevenue(input: {
    baselineRevenue: number;
    forecastPeriod: ForecastPeriod;
    config: PortfolioForecastEngineConfiguration;
    companyCount: number;
  }): { revenueForecast: number; confidenceScore: number } {
    const months = periodMultiplier(input.forecastPeriod);
    const growth =
      input.config.baselineRevenueGrowthRate / 100 + Math.min(0.04, input.companyCount * 0.005);
    const revenueForecast = Math.round(
      input.baselineRevenue * (1 + growth * (months / 12)),
    );
    const confidenceScore = Math.min(
      95,
      Math.max(
        input.config.minimumConfidenceThreshold,
        55 + Math.min(25, input.companyCount * 5) - (months > 6 ? 10 : 0),
      ),
    );
    return { revenueForecast, confidenceScore };
  }

  forecastProfit(input: {
    revenueForecast: number;
    baselineProfit: number;
    config: PortfolioForecastEngineConfiguration;
  }): { profitForecast: number; confidenceScore: number } {
    const margin = input.config.baselineProfitMargin / 100;
    const fromRevenue = Math.round(input.revenueForecast * margin);
    const profitForecast = Math.round((fromRevenue + input.baselineProfit) / 2);
    const confidenceScore = Math.min(
      92,
      Math.max(input.config.minimumConfidenceThreshold, 52),
    );
    return { profitForecast, confidenceScore };
  }
}
