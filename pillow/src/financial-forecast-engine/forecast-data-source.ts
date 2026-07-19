/** R3-13 — Forecast data source (read-only consumption of R3-04 through R3-12). */

import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { MultiCurrencyEngine } from "../multi-currency-engine/engine.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";
import type { ProfitRecord } from "../profit-calculation-engine/types.js";
import type { CashFlowRecord } from "../cash-flow-monitor/types.js";

export type ForecastFinancialSnapshot = {
  revenues: RevenueRecord[];
  expenses: ExpenseRecord[];
  profits: ProfitRecord[];
  cashFlows: CashFlowRecord[];
  currencyConversions: number;
  warnings: string[];
};

export class ForecastDataSource {
  constructor(
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
    private readonly multiCurrencyEngine: MultiCurrencyEngine | null,
  ) {}

  snapshot(): ForecastFinancialSnapshot {
    const warnings: string[] = [];
    let revenues: RevenueRecord[] = [];
    let expenses: ExpenseRecord[] = [];
    let profits: ProfitRecord[] = [];
    let cashFlows: CashFlowRecord[] = [];
    let currencyConversions = 0;

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

    if (this.multiCurrencyEngine) {
      currencyConversions = this.multiCurrencyEngine
        .getCurrencyRecords()
        .filter((r) => r.conversionStatus === "completed").length;
    } else {
      warnings.push("Multi-Currency Engine unavailable");
    }

    return { revenues, expenses, profits, cashFlows, currencyConversions, warnings };
  }
}
