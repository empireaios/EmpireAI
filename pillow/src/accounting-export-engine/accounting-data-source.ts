/** R3-17 — Accounting data source (read-only consumption of R3-04 through R3-11). */

import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { RefundEngine } from "../refund-engine/engine.js";
import type { TaxIntelligenceEngine } from "../tax-intelligence-engine/engine.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";
import type { ProfitRecord } from "../profit-calculation-engine/types.js";
import type { ReconciliationRecord } from "../reconciliation-engine/types.js";
import type { InvoiceRecord } from "../invoice-generator/types.js";
import type { RefundRecord } from "../refund-engine/types.js";
import type { TaxRecord } from "../tax-intelligence-engine/types.js";
import type { ExportScope } from "./types.js";

export type AccountingFinancialSnapshot = {
  revenues: RevenueRecord[];
  expenses: ExpenseRecord[];
  profits: ProfitRecord[];
  reconciliations: ReconciliationRecord[];
  invoices: InvoiceRecord[];
  refunds: RefundRecord[];
  taxes: TaxRecord[];
  warnings: string[];
};

export class AccountingDataSource {
  constructor(
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly reconciliationEngine: ReconciliationEngine | null,
    private readonly invoiceGenerator: InvoiceGeneratorEngine | null,
    private readonly refundEngine: RefundEngine | null,
    private readonly taxIntelligenceEngine: TaxIntelligenceEngine | null,
  ) {}

  snapshot(): AccountingFinancialSnapshot {
    const warnings: string[] = [];
    let revenues: RevenueRecord[] = [];
    let expenses: ExpenseRecord[] = [];
    let profits: ProfitRecord[] = [];
    let reconciliations: ReconciliationRecord[] = [];
    let invoices: InvoiceRecord[] = [];
    let refunds: RefundRecord[] = [];
    let taxes: TaxRecord[] = [];

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

    if (this.reconciliationEngine) {
      reconciliations = this.reconciliationEngine
        .getReconciliationRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Reconciliation Engine unavailable");
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

    if (this.taxIntelligenceEngine) {
      taxes = this.taxIntelligenceEngine
        .getTaxRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Tax Intelligence Engine unavailable");
    }

    return {
      revenues,
      expenses,
      profits,
      reconciliations,
      invoices,
      refunds,
      taxes,
      warnings,
    };
  }

  filterByScope(snapshot: AccountingFinancialSnapshot, scope: ExportScope): AccountingFinancialSnapshot {
    switch (scope) {
      case "revenue":
        return { ...snapshot, expenses: [], profits: [], reconciliations: [], invoices: [], refunds: [], taxes: [] };
      case "expense":
        return { ...snapshot, revenues: [], profits: [], reconciliations: [], invoices: [], refunds: [], taxes: [] };
      case "profit":
        return { ...snapshot, revenues: [], expenses: [], reconciliations: [], invoices: [], refunds: [], taxes: [] };
      case "reconciliation":
        return { ...snapshot, revenues: [], expenses: [], profits: [], invoices: [], refunds: [], taxes: [] };
      case "invoice":
        return { ...snapshot, revenues: [], expenses: [], profits: [], reconciliations: [], refunds: [], taxes: [] };
      case "refund":
        return { ...snapshot, revenues: [], expenses: [], profits: [], reconciliations: [], invoices: [], taxes: [] };
      case "tax":
        return { ...snapshot, revenues: [], expenses: [], profits: [], reconciliations: [], invoices: [], refunds: [] };
      default:
        return snapshot;
    }
  }
}
