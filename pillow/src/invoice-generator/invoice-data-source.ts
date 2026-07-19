/** R3-09 — Invoice data source (consumes R3-04, R3-05, R3-08). */

import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";

export type InvoiceFinancialSnapshot = {
  revenues: RevenueRecord[];
  expenses: ExpenseRecord[];
  reconciliationRecordCount: number;
  warnings: string[];
};

export class InvoiceDataSource {
  constructor(
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly reconciliationEngine: ReconciliationEngine | null,
  ) {}

  snapshot(): InvoiceFinancialSnapshot {
    const warnings: string[] = [];
    let revenues: RevenueRecord[] = [];
    let expenses: ExpenseRecord[] = [];
    let reconciliationRecordCount = 0;

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

    if (this.reconciliationEngine) {
      reconciliationRecordCount = this.reconciliationEngine.getReconciliationRecords().length;
    } else {
      warnings.push("Reconciliation Engine unavailable");
    }

    return { revenues, expenses, reconciliationRecordCount, warnings };
  }

  getRevenue(revenueReference: string): RevenueRecord | null {
    return this.snapshot().revenues.find((r) => r.revenueRecordId === revenueReference) ?? null;
  }

  getExpense(expenseReference: string): ExpenseRecord | null {
    return this.snapshot().expenses.find((e) => e.expenseRecordId === expenseReference) ?? null;
  }
}
