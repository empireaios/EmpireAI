/** R3-14 — Budget recommendation engine. */

import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type { BudgetFinancialSnapshot } from "./budget-data-source.js";
import type { BudgetRecord, BudgetRecommendation } from "./types.js";

export class BudgetRecommendationEngine {
  generate(
    record: BudgetRecord,
    snapshot: BudgetFinancialSnapshot,
    config: BudgetManagementEngineConfiguration,
  ): BudgetRecommendation[] {
    const recommendations: BudgetRecommendation[] = [];

    if (record.budgetUtilizationPercentage >= config.overrunThresholdPercent) {
      recommendations.push({
        recommendationId: `bmg-reco-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        priority: "high",
        description: `Reduce spending in ${record.budgetCategory} — utilization at ${record.budgetUtilizationPercentage}%`,
        budgetRecordId: record.budgetRecordId,
        suggestedAction: "Review and reduce discretionary expenses in this category",
      });
    } else if (record.budgetUtilizationPercentage >= 80) {
      recommendations.push({
        recommendationId: `bmg-reco-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        priority: "medium",
        description: `Monitor ${record.budgetCategory} spending — approaching budget limit`,
        budgetRecordId: record.budgetRecordId,
        suggestedAction: "Set spending alerts and review upcoming commitments",
      });
    } else if (record.budgetUtilizationPercentage < 50 && record.budgetAllocation > 0) {
      recommendations.push({
        recommendationId: `bmg-reco-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        priority: "low",
        description: `Underutilized budget in ${record.budgetCategory} — ${record.budgetUtilizationPercentage}% used`,
        budgetRecordId: record.budgetRecordId,
        suggestedAction: "Consider reallocating unused funds to higher-priority categories",
      });
    }

    const forecast = snapshot.forecasts[snapshot.forecasts.length - 1];
    if (forecast && record.budgetUtilizationPercentage > 70) {
      const projectedExpense = forecast.expenseForecast;
      if (projectedExpense > record.budgetAllocation) {
        recommendations.push({
          recommendationId: `bmg-reco-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          priority: "medium",
          description: "Forecast indicates potential budget shortfall",
          budgetRecordId: record.budgetRecordId,
          suggestedAction: "Increase allocation or implement cost controls based on forecast",
        });
      }
    }

    return recommendations;
  }
}
