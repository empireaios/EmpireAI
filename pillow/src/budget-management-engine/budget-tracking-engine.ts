/** R3-14 — Budget tracking engine. */

import type { BudgetFinancialSnapshot } from "./budget-data-source.js";
import type { BudgetRecord } from "./types.js";

export class BudgetTrackingEngine {
  trackUtilization(
    record: BudgetRecord,
    snapshot: BudgetFinancialSnapshot,
    actualForCategory: number,
  ): BudgetRecord {
    const actualExpenditure = actualForCategory;
    const remaining = Math.round((record.budgetAllocation - actualExpenditure) * 100) / 100;
    const variance = Math.round((actualExpenditure - record.budgetAllocation) * 100) / 100;
    const utilization =
      record.budgetAllocation > 0
        ? Math.round((actualExpenditure / record.budgetAllocation) * 10000) / 100
        : 0;
    const budgetStatus =
      utilization >= 100 ? "exceeded" : utilization > 0 ? "active" : record.budgetStatus;

    return {
      ...record,
      timestamp: new Date().toISOString(),
      actualExpenditure,
      remainingBudget: remaining,
      budgetVariance: variance,
      budgetUtilizationPercentage: utilization,
      budgetStatus,
    };
  }

  compareActualVsBudget(
    record: BudgetRecord,
    snapshot: BudgetFinancialSnapshot,
    actualForCategory: number,
  ): {
    actual: number;
    budgeted: number;
    variance: number;
    variancePercent: number;
    utilizationPercent: number;
  } {
    const actual = actualForCategory;
    const budgeted = record.budgetAllocation;
    const variance = Math.round((actual - budgeted) * 100) / 100;
    const variancePercent =
      budgeted > 0 ? Math.round((variance / budgeted) * 10000) / 100 : 0;
    const utilizationPercent =
      budgeted > 0 ? Math.round((actual / budgeted) * 10000) / 100 : 0;

    return { actual, budgeted, variance, variancePercent, utilizationPercent };
  }
}
