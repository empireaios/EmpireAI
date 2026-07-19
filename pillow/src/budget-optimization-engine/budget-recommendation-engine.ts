/** R5-13 — Budget Recommendation Engine. */

import type { BudgetRecord } from "./types.js";

export class BudgetRecommendationEngine {
  recommend(record: BudgetRecord): string {
    if (record.overspendDetected) {
      return `Reduce spend on ${record.marketingChannel} — utilization ${record.budgetUtilization}% exceeds allocation.`;
    }
    if (record.inefficiencyDetected) {
      return `Shift budget away from ${record.marketingChannel} — efficiency ${record.efficiencyScore} below threshold.`;
    }
    if (record.budgetUtilization < 25) {
      return `Increase pacing on ${record.marketingChannel} — only ${record.budgetUtilization}% utilized.`;
    }
    if (record.efficiencyScore >= 70 && record.remainingBudget > 0) {
      return `Increase allocation to ${record.marketingChannel} — high efficiency with remaining budget.`;
    }
    return `Maintain allocation for ${record.marketingChannel} — performance within target band.`;
  }

  recommendForSet(records: BudgetRecord[]): BudgetRecord[] {
    return records.map((record) => ({
      ...record,
      optimizationRecommendation: this.recommend(record),
      timestamp: new Date().toISOString(),
    }));
  }
}
