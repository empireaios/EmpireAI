/** R3-15 — Budget risk engine. */

import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type { RiskFinancialSnapshot } from "./risk-data-source.js";

export class BudgetRiskEngine {
  calculate(snapshot: RiskFinancialSnapshot, config: FinancialRiskMonitorConfiguration): number {
    if (snapshot.budgets.length === 0) return 30;

    let score = 0;
    const exceeded = snapshot.budgets.filter((b) => b.budgetStatus === "exceeded").length;
    if (exceeded > 0) score += 40;
    if (snapshot.budgetUtilization >= config.budgetRiskThreshold) score += 35;
    else if (snapshot.budgetUtilization >= config.budgetRiskThreshold * 0.8) score += 20;
    else score += 5;

    return Math.min(100, Math.round(score));
  }
}
