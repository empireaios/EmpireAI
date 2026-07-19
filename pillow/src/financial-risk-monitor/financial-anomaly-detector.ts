/** R3-15 — Financial anomaly detector. */

import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type { RiskFinancialSnapshot } from "./risk-data-source.js";
import type { FinancialAnomaly, FinancialRiskRecord } from "./types.js";

export class FinancialAnomalyDetector {
  detect(
    record: FinancialRiskRecord,
    snapshot: RiskFinancialSnapshot,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = [];

    if (snapshot.netProfit < 0) {
      anomalies.push({
        anomalyId: `frm-anom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        severity: "high",
        metric: "profitability",
        description: "Negative net profit detected",
        financialRiskId: record.financialRiskId,
        deviationPercent: 100,
      });
    }

    if (snapshot.cashFlowBalance < 0) {
      anomalies.push({
        anomalyId: `frm-anom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        severity: "high",
        metric: "cash_flow",
        description: "Negative cash flow balance detected",
        financialRiskId: record.financialRiskId,
        deviationPercent: 100,
      });
    }

    if (record.revenueRisk > config.revenueVolatilityThreshold) {
      anomalies.push({
        anomalyId: `frm-anom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        severity: record.revenueRisk > config.revenueVolatilityThreshold * 2 ? "high" : "medium",
        metric: "revenue_volatility",
        description: `Revenue volatility risk at ${record.revenueRisk}`,
        financialRiskId: record.financialRiskId,
        deviationPercent: record.revenueRisk,
      });
    }

    if (record.expenseRisk > config.expenseVolatilityThreshold) {
      anomalies.push({
        anomalyId: `frm-anom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        severity: record.expenseRisk > config.expenseVolatilityThreshold * 2 ? "high" : "medium",
        metric: "expense_volatility",
        description: `Expense volatility risk at ${record.expenseRisk}`,
        financialRiskId: record.financialRiskId,
        deviationPercent: record.expenseRisk,
      });
    }

    const exceededBudgets = snapshot.budgets.filter((b) => b.budgetStatus === "exceeded");
    if (exceededBudgets.length > 0) {
      anomalies.push({
        anomalyId: `frm-anom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        severity: "medium",
        metric: "budget",
        description: `${exceededBudgets.length} budget(s) exceeded`,
        financialRiskId: record.financialRiskId,
        deviationPercent: snapshot.budgetUtilization,
      });
    }

    return anomalies;
  }
}
