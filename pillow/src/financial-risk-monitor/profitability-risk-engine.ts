/** R3-15 — Profitability risk engine. */

import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type { RiskFinancialSnapshot } from "./risk-data-source.js";

export class ProfitabilityRiskEngine {
  calculate(snapshot: RiskFinancialSnapshot, config: FinancialRiskMonitorConfiguration): number {
    if (snapshot.totalRevenue === 0 && snapshot.profits.length === 0) return 40;

    let score = 0;
    if (snapshot.netProfit < 0) score += 50;
    else {
      const margin =
        snapshot.totalRevenue > 0
          ? (snapshot.netProfit / snapshot.totalRevenue) * 100
          : 0;
      if (margin < 5) score += 35;
      else if (margin < config.profitabilityRiskThreshold / 10) score += 20;
      else score += 5;
    }

    const forecast = snapshot.forecasts[snapshot.forecasts.length - 1];
    if (forecast && forecast.profitForecast < 0) score += 15;

    return Math.min(100, Math.round(score));
  }
}
