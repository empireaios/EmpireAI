/** R5-13 — Spend Monitoring Engine. */

import type { BudgetOptimizationEngineConfiguration } from "./configuration.js";
import type { BudgetRecord } from "./types.js";

export class SpendMonitoringEngine {
  refresh(record: BudgetRecord, config: BudgetOptimizationEngineConfiguration): BudgetRecord {
    const remaining = Math.max(0, record.allocatedBudget - record.currentSpend);
    const utilization =
      record.allocatedBudget <= 0
        ? 0
        : Math.round((record.currentSpend / record.allocatedBudget) * 10000) / 100;
    const overspendDetected = utilization >= config.overspendThresholdPercent;
    const inefficiencyDetected = record.efficiencyScore < config.inefficiencyThresholdPercent;

    return {
      ...record,
      remainingBudget: Math.round(remaining * 100) / 100,
      budgetUtilization: utilization,
      overspendDetected,
      inefficiencyDetected,
      timestamp: new Date().toISOString(),
    };
  }

  detectOverspend(records: BudgetRecord[]): BudgetRecord[] {
    return records.filter((r) => r.overspendDetected || r.currentSpend > r.allocatedBudget);
  }

  detectInefficiencies(records: BudgetRecord[]): BudgetRecord[] {
    return records.filter((r) => r.inefficiencyDetected);
  }
}
