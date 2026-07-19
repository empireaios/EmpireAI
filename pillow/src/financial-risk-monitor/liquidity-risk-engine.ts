/** R3-15 — Liquidity risk engine. */

import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type { RiskFinancialSnapshot } from "./risk-data-source.js";

export class LiquidityRiskEngine {
  calculate(snapshot: RiskFinancialSnapshot, config: FinancialRiskMonitorConfiguration): number {
    if (snapshot.cashFlows.length === 0) return 50;

    let score = 0;
    if (snapshot.cashFlowBalance < 0) score += 50;
    else if (snapshot.cashFlowBalance < config.liquidityRiskThreshold) score += 30;
    else score += 10;

    const forecast = snapshot.forecasts[snapshot.forecasts.length - 1];
    if (forecast && forecast.liquidityForecast < snapshot.cashFlowBalance * 0.5) {
      score += 20;
    }

    return Math.min(100, Math.round(score));
  }
}
