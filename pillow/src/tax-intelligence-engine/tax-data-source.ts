/** R3-11 — Tax data source (read-only consumption of R3-04 through R3-10). */

import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { RefundEngine } from "../refund-engine/engine.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";
import type { InvoiceRecord } from "../invoice-generator/types.js";
import type { RefundRecord } from "../refund-engine/types.js";

export type TaxFinancialSnapshot = {
  revenues: RevenueRecord[];
  expenses: ExpenseRecord[];
  invoices: InvoiceRecord[];
  refunds: RefundRecord[];
  warnings: string[];
};

export class TaxDataSource {
  constructor(
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly reconciliationEngine: ReconciliationEngine | null,
    private readonly invoiceGenerator: InvoiceGeneratorEngine | null,
    private readonly refundEngine: RefundEngine | null,
  ) {}

  snapshot(): TaxFinancialSnapshot {
    const warnings: string[] = [];
    let revenues: RevenueRecord[] = [];
    let expenses: ExpenseRecord[] = [];
    let invoices: InvoiceRecord[] = [];
    let refunds: RefundRecord[] = [];

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

    if (this.invoiceGenerator) {
      invoices = this.invoiceGenerator
        .getInvoiceRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Invoice Generator unavailable");
    }

    if (this.refundEngine) {
      refunds = this.refundEngine
        .getRefundRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Refund Engine unavailable");
    }

    if (!this.profitCalculationEngine) warnings.push("Profit Calculation Engine unavailable");
    if (!this.reconciliationEngine) warnings.push("Reconciliation Engine unavailable");

    return { revenues, expenses, invoices, refunds, warnings };
  }

  getRevenue(revenueReference: string): RevenueRecord | null {
    return this.snapshot().revenues.find((r) => r.revenueRecordId === revenueReference) ?? null;
  }

  getExpense(expenseReference: string): ExpenseRecord | null {
    return this.snapshot().expenses.find((r) => r.expenseRecordId === expenseReference) ?? null;
  }

  getInvoice(invoiceReference: string): InvoiceRecord | null {
    return this.snapshot().invoices.find((r) => r.invoiceId === invoiceReference) ?? null;
  }

  getRefund(refundReference: string): RefundRecord | null {
    return this.snapshot().refunds.find((r) => r.refundId === refundReference) ?? null;
  }
}
