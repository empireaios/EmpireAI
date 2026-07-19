/** R3-13 — Forecast analytics engine. */

import type { ForecastFinancialSnapshot } from "./forecast-data-source.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";

export class ForecastAnalyticsEngine {
  computeConfidence(
    snapshot: ForecastFinancialSnapshot,
    config: FinancialForecastEngineConfiguration,
  ): number {
    let score = 40;
    score += Math.min(20, snapshot.revenues.length * 5);
    score += Math.min(20, snapshot.expenses.length * 5);
    if (snapshot.profits.length > 0) score += 10;
    if (snapshot.cashFlows.length > 0) score += 10;
    if (snapshot.currencyConversions > 0) score += 5;

    if (snapshot.revenues.length === 0 && snapshot.expenses.length === 0) {
      score = Math.min(score, 30);
    }

    return Math.max(0, Math.min(100, score));
  }

  resolvePeriodMultiplier(
    period: string,
    config: FinancialForecastEngineConfiguration,
  ): { multiplier: number; error: string | null } {
    if (!config.forecastPeriodRulesEnabled) {
      return { multiplier: 1, error: null };
    }

    const rule = config.periodRules.find((r) => r.period === period);
    if (!rule) {
      return { multiplier: 0, error: `Invalid forecast period: ${period}` };
    }
    return { multiplier: rule.multiplier, error: null };
  }
}
