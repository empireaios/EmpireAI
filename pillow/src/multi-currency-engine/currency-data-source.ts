/** R3-12 — Currency data source (read-only consumption of R3-03 through R3-11). */

import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { TaxIntelligenceEngine } from "../tax-intelligence-engine/engine.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";

export type CurrencyFinancialSnapshot = {
  revenues: RevenueRecord[];
  expenses: ExpenseRecord[];
  transactionCurrencies: string[];
  warnings: string[];
};

export class CurrencyDataSource {
  constructor(
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly taxIntelligenceEngine: TaxIntelligenceEngine | null,
  ) {}

  snapshot(): CurrencyFinancialSnapshot {
    const warnings: string[] = [];
    let revenues: RevenueRecord[] = [];
    let expenses: ExpenseRecord[] = [];

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

    if (!this.bankingIntegration) warnings.push("Banking Integration unavailable");
    if (!this.profitCalculationEngine) warnings.push("Profit Calculation Engine unavailable");
    if (!this.taxIntelligenceEngine) warnings.push("Tax Intelligence Engine unavailable");

    const transactionCurrencies = [
      ...new Set([
        ...revenues.map((r) => r.currency),
        ...expenses.map((e) => e.currency),
      ]),
    ];

    return { revenues, expenses, transactionCurrencies, warnings };
  }

  getRevenue(revenueReference: string): RevenueRecord | null {
    return this.snapshot().revenues.find((r) => r.revenueRecordId === revenueReference) ?? null;
  }

  getExpense(expenseReference: string): ExpenseRecord | null {
    return this.snapshot().expenses.find((r) => r.expenseRecordId === expenseReference) ?? null;
  }
}
