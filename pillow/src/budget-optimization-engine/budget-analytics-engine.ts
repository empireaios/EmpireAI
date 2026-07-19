/** R5-13 — Budget Analytics Engine. */

import type { BudgetRecord } from "./types.js";

export class BudgetAnalyticsEngine {
  calculateEfficiency(input: {
    allocatedBudget: number;
    currentSpend: number;
    attributedRevenue?: number;
    audienceQuality?: number;
  }): number {
    if (input.allocatedBudget <= 0) return 0;
    const spendRatio = Math.min(1, input.currentSpend / input.allocatedBudget);
    const revenueScore =
      input.attributedRevenue !== undefined && input.currentSpend > 0
        ? Math.min(100, (input.attributedRevenue / input.currentSpend) * 25)
        : 50;
    const audienceScore = input.audienceQuality ?? 50;
    const utilizationScore = spendRatio * 40;
    return Math.round(
      Math.max(0, Math.min(100, utilizationScore + revenueScore * 0.4 + audienceScore * 0.2)),
    );
  }

  averageUtilization(records: BudgetRecord[]): number {
    if (records.length === 0) return 0;
    return (
      Math.round(
        (records.reduce((sum, r) => sum + r.budgetUtilization, 0) / records.length) * 100,
      ) / 100
    );
  }
}
