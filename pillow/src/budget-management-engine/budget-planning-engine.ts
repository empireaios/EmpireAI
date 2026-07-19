/** R3-14 — Budget planning engine. */

import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type { BudgetFinancialSnapshot } from "./budget-data-source.js";

export class BudgetPlanningEngine {
  suggestAllocation(
    category: string,
    period: string,
    snapshot: BudgetFinancialSnapshot,
    config: BudgetManagementEngineConfiguration,
  ): { suggestedAllocation: number; warnings: string[] } {
    const warnings: string[] = [];
    const actual = snapshot.categoryExpenses[category] ?? 0;
    const forecast = snapshot.forecasts[snapshot.forecasts.length - 1];

    let base = actual > 0 ? actual : snapshot.totalExpenses * 0.1;
    if (forecast) {
      const periodMultiplier = period === "annual" ? 12 : period === "quarterly" ? 3 : 1;
      const forecastExpense = (forecast.expenseForecast / 30) * 30 * periodMultiplier;
      base = Math.max(base, forecastExpense * 0.5);
      warnings.push("Forecast data incorporated into allocation suggestion");
    }

    if (!config.budgetAllocationRulesEnabled) {
      warnings.push("Budget allocation rules disabled — using baseline");
    }

    const suggestedAllocation = Math.round(base * 1.1 * 100) / 100;
    return { suggestedAllocation, warnings };
  }
}
