/** R3-14 — Budget data source (read-only consumption of R3-04 through R3-13). */

import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";
import type { ProfitRecord } from "../profit-calculation-engine/types.js";
import type { CashFlowRecord } from "../cash-flow-monitor/types.js";
import type { ForecastRecord } from "../financial-forecast-engine/types.js";

export type BudgetFinancialSnapshot = {
  revenues: RevenueRecord[];
  expenses: ExpenseRecord[];
  profits: ProfitRecord[];
  cashFlows: CashFlowRecord[];
  forecasts: ForecastRecord[];
  totalRevenue: number;
  totalExpenses: number;
  categoryExpenses: Record<string, number>;
  warnings: string[];
};

export class BudgetDataSource {
  constructor(
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
    private readonly financialForecastEngine: FinancialForecastEngine | null,
  ) {}

  snapshot(): BudgetFinancialSnapshot {
    const warnings: string[] = [];
    let revenues: RevenueRecord[] = [];
    let expenses: ExpenseRecord[] = [];
    let profits: ProfitRecord[] = [];
    let cashFlows: CashFlowRecord[] = [];
    let forecasts: ForecastRecord[] = [];

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

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.netRevenue ?? r.grossRevenue ?? 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.expenseAmount ?? 0), 0);

    const categoryExpenses: Record<string, number> = {};
    for (const expense of expenses) {
      const category = this.mapExpenseToCategory(expense);
      categoryExpenses[category] = (categoryExpenses[category] ?? 0) + (expense.expenseAmount ?? 0);
    }

    return {
      revenues,
      expenses,
      profits,
      cashFlows,
      forecasts,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      categoryExpenses,
      warnings,
    };
  }

  private mapExpenseToCategory(expense: ExpenseRecord): string {
    const cat = expense.expenseCategory;
    if (cat === "supplier_payment") return "supplies";
    if (cat === "shipping") return "supplies";
    if (cat === "advertising") return "marketing";
    if (cat === "operational") return "operations";
    if (cat === "recurring") return "payroll";
    if (cat === "platform_fee") return "overhead";
    const ref = (expense.supplierReference ?? "").toLowerCase();
    if (ref.includes("supplier") || ref.includes("shipping")) return "supplies";
    if (ref.includes("marketing") || ref.includes("ad")) return "marketing";
    return "other";
  }

  getActualForCategory(category: string, snapshot: BudgetFinancialSnapshot): number {
    return Math.round((snapshot.categoryExpenses[category] ?? 0) * 100) / 100;
  }
}
