/** R3-13 — Cash flow forecast engine. */

import type { ForecastFinancialSnapshot } from "./forecast-data-source.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";

export class CashFlowForecastEngine {
  forecastCashFlow(
    snapshot: ForecastFinancialSnapshot,
    revenueForecast: number,
    expenseForecast: number,
    multiplier: number,
    config: FinancialForecastEngineConfiguration,
  ): { cashFlow: number; liquidity: number; warnings: string[] } {
    const warnings: string[] = [];

    const historicalNet = snapshot.cashFlows.reduce((s, c) => s + c.netCashFlow, 0);
    const projectedNet = revenueForecast - expenseForecast;
    const cashFlow =
      snapshot.cashFlows.length > 0
        ? Math.round((historicalNet / snapshot.cashFlows.length) * multiplier * 100) / 100
        : Math.round(projectedNet * 100) / 100;

    const latestClosing = snapshot.cashFlows[snapshot.cashFlows.length - 1]?.closingBalance ?? 0;
    const liquidity = Math.round((latestClosing + cashFlow) * 100) / 100;

    if (snapshot.cashFlows.length === 0) {
      warnings.push("No cash flow history — liquidity derived from projected net");
    }
    if (!config.forecastCalculationRulesEnabled) {
      warnings.push("Forecast calculation rules disabled");
    }

    return { cashFlow, liquidity, warnings };
  }
}
