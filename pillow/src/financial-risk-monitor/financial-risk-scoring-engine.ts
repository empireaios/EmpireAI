/** R3-15 — Financial risk scoring engine. */

import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type { RiskFinancialSnapshot } from "./risk-data-source.js";
import { LiquidityRiskEngine } from "./liquidity-risk-engine.js";
import { ProfitabilityRiskEngine } from "./profitability-risk-engine.js";
import { BudgetRiskEngine } from "./budget-risk-engine.js";

export type RiskScoreResult = {
  compositeScore: number;
  liquidityRisk: number;
  profitabilityRisk: number;
  budgetRisk: number;
  revenueRisk: number;
  expenseRisk: number;
  cashFlowRisk: number;
};

export class FinancialRiskScoringEngine {
  private readonly liquidityEngine = new LiquidityRiskEngine();
  private readonly profitabilityEngine = new ProfitabilityRiskEngine();
  private readonly budgetEngine = new BudgetRiskEngine();

  calculate(
    snapshot: RiskFinancialSnapshot,
    config: FinancialRiskMonitorConfiguration,
  ): RiskScoreResult {
    const liquidityRisk = this.liquidityEngine.calculate(snapshot, config);
    const profitabilityRisk = this.profitabilityEngine.calculate(snapshot, config);
    const budgetRisk = this.budgetEngine.calculate(snapshot, config);
    const revenueRisk = this.calculateRevenueVolatility(snapshot, config);
    const expenseRisk = this.calculateExpenseVolatility(snapshot, config);
    const cashFlowRisk = snapshot.cashFlowBalance < 0 ? 70 : snapshot.cashFlowBalance < 100 ? 40 : 15;

    const compositeScore = Math.round(
      (liquidityRisk * 0.25 +
        profitabilityRisk * 0.2 +
        budgetRisk * 0.15 +
        revenueRisk * 0.15 +
        expenseRisk * 0.15 +
        cashFlowRisk * 0.1) *
        100,
    ) / 100;

    return {
      compositeScore: Math.min(100, compositeScore),
      liquidityRisk,
      profitabilityRisk,
      budgetRisk,
      revenueRisk,
      expenseRisk,
      cashFlowRisk,
    };
  }

  private calculateRevenueVolatility(
    snapshot: RiskFinancialSnapshot,
    config: FinancialRiskMonitorConfiguration,
  ): number {
    if (snapshot.revenues.length < 2) return 20;
    const amounts = snapshot.revenues.map((r) => r.netRevenue ?? r.grossRevenue ?? 0);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (avg === 0) return 30;
    const maxDev = Math.max(...amounts.map((a) => Math.abs(a - avg) / avg * 100));
    return Math.min(100, Math.round(maxDev > config.revenueVolatilityThreshold ? maxDev : maxDev * 0.5));
  }

  private calculateExpenseVolatility(
    snapshot: RiskFinancialSnapshot,
    config: FinancialRiskMonitorConfiguration,
  ): number {
    if (snapshot.expenses.length < 2) return 20;
    const amounts = snapshot.expenses.map((e) => e.expenseAmount ?? 0);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (avg === 0) return 30;
    const maxDev = Math.max(...amounts.map((a) => Math.abs(a - avg) / avg * 100));
    return Math.min(100, Math.round(maxDev > config.expenseVolatilityThreshold ? maxDev : maxDev * 0.5));
  }
}
