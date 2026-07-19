/** R3-15 — Financial health engine. */

import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type { RiskFinancialSnapshot } from "./risk-data-source.js";
import type { RiskStatus } from "./types.js";

export type HealthAssessment = {
  overallStatus: RiskStatus;
  liquidityStatus: RiskStatus;
  profitabilityStatus: RiskStatus;
  budgetStatus: RiskStatus;
  cashFlowStatus: RiskStatus;
  warnings: string[];
};

export class FinancialHealthEngine {
  assess(
    snapshot: RiskFinancialSnapshot,
    config: FinancialRiskMonitorConfiguration,
  ): HealthAssessment {
    const warnings = [...snapshot.warnings];

    const liquidityStatus = this.assessLiquidity(snapshot, config);
    const profitabilityStatus = this.assessProfitability(snapshot, config);
    const budgetStatus = this.assessBudget(snapshot, config);
    const cashFlowStatus = this.assessCashFlow(snapshot);

    const statuses = [liquidityStatus, profitabilityStatus, budgetStatus, cashFlowStatus];
    const overallStatus = statuses.includes("critical")
      ? "critical"
      : statuses.includes("warning")
        ? "warning"
        : statuses.every((s) => s === "healthy")
          ? "healthy"
          : "unknown";

    return {
      overallStatus,
      liquidityStatus,
      profitabilityStatus,
      budgetStatus,
      cashFlowStatus,
      warnings,
    };
  }

  private assessLiquidity(
    snapshot: RiskFinancialSnapshot,
    config: FinancialRiskMonitorConfiguration,
  ): RiskStatus {
    if (snapshot.cashFlows.length === 0) return "unknown";
    if (snapshot.cashFlowBalance < 0) return "critical";
    if (snapshot.cashFlowBalance < config.liquidityRiskThreshold) return "warning";
    return "healthy";
  }

  private assessProfitability(
    snapshot: RiskFinancialSnapshot,
    config: FinancialRiskMonitorConfiguration,
  ): RiskStatus {
    if (snapshot.profits.length === 0 && snapshot.totalRevenue === 0) return "unknown";
    if (snapshot.netProfit < 0) return "critical";
    const margin =
      snapshot.totalRevenue > 0
        ? (snapshot.netProfit / snapshot.totalRevenue) * 100
        : 0;
    if (margin < config.profitabilityRiskThreshold / 10) return "warning";
    return "healthy";
  }

  private assessBudget(
    snapshot: RiskFinancialSnapshot,
    config: FinancialRiskMonitorConfiguration,
  ): RiskStatus {
    if (snapshot.budgets.length === 0) return "unknown";
    if (snapshot.budgetUtilization >= config.budgetRiskThreshold) return "critical";
    if (snapshot.budgetUtilization >= config.budgetRiskThreshold * 0.8) return "warning";
    return "healthy";
  }

  private assessCashFlow(snapshot: RiskFinancialSnapshot): RiskStatus {
    if (snapshot.cashFlows.length === 0) return "unknown";
    const latest = snapshot.cashFlows[snapshot.cashFlows.length - 1]!;
    if (latest.netCashFlow < 0) return "warning";
    return "healthy";
  }
}
