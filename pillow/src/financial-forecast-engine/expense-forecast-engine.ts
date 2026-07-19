/** R3-13 — Expense forecast engine. */

import type { ForecastFinancialSnapshot } from "./forecast-data-source.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";

export class ExpenseForecastEngine {
  forecast(
    snapshot: ForecastFinancialSnapshot,
    multiplier: number,
    config: FinancialForecastEngineConfiguration,
  ): { amount: number; warnings: string[] } {
    const warnings: string[] = [];
    if (!config.forecastCalculationRulesEnabled) {
      warnings.push("Forecast calculation rules disabled");
    }

    const baseExpense = snapshot.expenses.reduce((s, e) => s + e.expenseAmount, 0);
    if (snapshot.expenses.length === 0) {
      warnings.push("No historical expense records — using zero baseline");
    }

    return {
      amount: Math.round(baseExpense * multiplier * 100) / 100,
      warnings,
    };
  }
}
