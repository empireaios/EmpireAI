/** R3-15 — Financial risk data source (read-only consumption of R3-04 through R3-14). */

import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import type { BudgetManagementEngine } from "../budget-management-engine/engine.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";
import type { ProfitRecord } from "../profit-calculation-engine/types.js";
import type { CashFlowRecord } from "../cash-flow-monitor/types.js";
import type { ForecastRecord } from "../financial-forecast-engine/types.js";
import type { BudgetRecord } from "../budget-management-engine/types.js";

export type RiskFinancialSnapshot = {
  revenues: RevenueRecord[];
  expenses: ExpenseRecord[];
  profits: ProfitRecord[];
  cashFlows: CashFlowRecord[];
  forecasts: ForecastRecord[];
  budgets: BudgetRecord[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashFlowBalance: number;
  budgetUtilization: number;
  warnings: string[];
};

export class RiskDataSource {
  constructor(
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
    private readonly financialForecastEngine: FinancialForecastEngine | null,
    private readonly budgetManagementEngine: BudgetManagementEngine | null,
  ) {}

  snapshot(): RiskFinancialSnapshot {
    const warnings: string[] = [];
    let revenues: RevenueRecord[] = [];
    let expenses: ExpenseRecord[] = [];
    let profits: ProfitRecord[] = [];
    let cashFlows: CashFlowRecord[] = [];
    let forecasts: ForecastRecord[] = [];
    let budgets: BudgetRecord[] = [];

    if (this.revenueEngine) {
      revenues = this.revenueEngine
        .getRevenueRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Revenue Engine unavailable");
    }

    if (this.expenseEngine) {
      expenses = this.expenseEngine
        .getExpenseRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Expense Engine unavailable");
    }

    if (this.profitCalculationEngine) {
      profits = this.profitCalculationEngine
        .getProfitRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Profit Calculation Engine unavailable");
    }

    if (this.cashFlowMonitor) {
      cashFlows = this.cashFlowMonitor
        .getCashFlowRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Cash Flow Monitor unavailable");
    }

    if (this.financialForecastEngine) {
      forecasts = this.financialForecastEngine.getForecastRecords();
    } else {
      warnings.push("Financial Forecast Engine unavailable");
    }

    if (this.budgetManagementEngine) {
      budgets = this.budgetManagementEngine.getBudgetRecords();
    } else {
      warnings.push("Budget Management Engine unavailable");
    }

    const totalRevenue = revenues.reduce(
      (sum, r) => sum + (r.netRevenue ?? r.grossRevenue ?? 0),
      0,
    );
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.expenseAmount ?? 0), 0);
    const latestProfit = profits[profits.length - 1];
    const netProfit = latestProfit?.netProfit ?? totalRevenue - totalExpenses;
    const latestCashFlow = cashFlows[cashFlows.length - 1];
    const cashFlowBalance = latestCashFlow?.netCashFlow ?? 0;
    const budgetUtilization =
      budgets.length > 0
        ? budgets.reduce((sum, b) => sum + b.budgetUtilizationPercentage, 0) / budgets.length
        : 0;

    return {
      revenues,
      expenses,
      profits,
      cashFlows,
      forecasts,
      budgets,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      cashFlowBalance: Math.round(cashFlowBalance * 100) / 100,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      warnings,
    };
  }
}
