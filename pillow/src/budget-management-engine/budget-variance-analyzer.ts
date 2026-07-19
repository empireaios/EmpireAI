/** R3-14 — Budget variance analyzer. */

import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type { BudgetRecord, BudgetVariance, BudgetOverrun } from "./types.js";

export class BudgetVarianceAnalyzer {
  detectVariances(
    record: BudgetRecord,
    config: BudgetManagementEngineConfiguration,
  ): BudgetVariance[] {
    const variances: BudgetVariance[] = [];
    const variancePercent =
      record.budgetAllocation > 0
        ? Math.round((record.budgetVariance / record.budgetAllocation) * 10000) / 100
        : 0;

    if (Math.abs(variancePercent) < config.varianceThresholdPercent) return variances;

    const severity =
      Math.abs(variancePercent) >= config.varianceThresholdPercent * 3
        ? "high"
        : Math.abs(variancePercent) >= config.varianceThresholdPercent * 2
          ? "medium"
          : "low";

    variances.push({
      varianceId: `bmg-var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      severity,
      description: `Budget variance of ${variancePercent}% for ${record.budgetCategory} (${record.budgetPeriod})`,
      budgetRecordId: record.budgetRecordId,
      varianceAmount: record.budgetVariance,
      variancePercent,
    });

    return variances;
  }

  detectOverruns(
    record: BudgetRecord,
    config: BudgetManagementEngineConfiguration,
  ): BudgetOverrun[] {
    const overruns: BudgetOverrun[] = [];

    if (record.budgetUtilizationPercentage < config.overrunThresholdPercent) return overruns;

    const overrunAmount = Math.max(0, record.actualExpenditure - record.budgetAllocation);
    const severity =
      record.budgetUtilizationPercentage >= 150
        ? "high"
        : record.budgetUtilizationPercentage >= 120
          ? "medium"
          : "low";

    overruns.push({
      overrunId: `bmg-ovr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      severity,
      description: `Budget overrun: ${record.budgetUtilizationPercentage}% utilization for ${record.budgetCategory}`,
      budgetRecordId: record.budgetRecordId,
      overrunAmount: Math.round(overrunAmount * 100) / 100,
    });

    return overruns;
  }
}
