/** R3-13 — Revenue forecast engine. */

import type { ForecastFinancialSnapshot } from "./forecast-data-source.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";

export class RevenueForecastEngine {
  forecast(
    snapshot: ForecastFinancialSnapshot,
    multiplier: number,
    config: FinancialForecastEngineConfiguration,
  ): { amount: number; warnings: string[] } {
    const warnings: string[] = [];
    if (!config.forecastCalculationRulesEnabled) {
      warnings.push("Forecast calculation rules disabled");
    }

    const baseRevenue = snapshot.revenues.reduce((s, r) => s + r.netRevenue, 0);
    if (snapshot.revenues.length === 0) {
      warnings.push("No historical revenue records — using zero baseline");
    }

    return {
      amount: Math.round(baseRevenue * multiplier * 100) / 100,
      warnings,
    };
  }
}
