/** R3-08 — Reconciliation data source (consumes R3-02 through R3-07). */

import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { PaymentRecord } from "../payment-gateway-integration/types.js";
import type { BankingRecord, BankingTransactionRecord } from "../banking-integration/types.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";
import type { CashFlowRecord } from "../cash-flow-monitor/types.js";

export type ReconciliationFinancialSnapshot = {
  payments: PaymentRecord[];
  bankingRecords: BankingRecord[];
  transactions: BankingTransactionRecord[];
  revenues: RevenueRecord[];
  expenses: ExpenseRecord[];
  cashFlowRecords: CashFlowRecord[];
  warnings: string[];
};

export class ReconciliationDataSource {
  constructor(
    private readonly paymentGateway: PaymentGatewayIntegrationEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
  ) {}

  snapshot(): ReconciliationFinancialSnapshot {
    const warnings: string[] = [];
    let payments: PaymentRecord[] = [];
    let bankingRecords: BankingRecord[] = [];
    let transactions: BankingTransactionRecord[] = [];
    let revenues: RevenueRecord[] = [];
    let expenses: ExpenseRecord[] = [];
    let cashFlowRecords: CashFlowRecord[] = [];

    if (this.paymentGateway) {
      payments = this.paymentGateway
        .getPaymentRecords()
        .filter((p) => p.validationStatus === "passed");
    } else {
      warnings.push("Payment Gateway Integration unavailable");
    }

    if (this.bankingIntegration) {
      bankingRecords = this.bankingIntegration
        .getBankingRecords()
        .filter((r) => r.validationStatus === "passed");
      transactions = this.bankingIntegration.getTransactionRecords();
    } else {
      warnings.push("Banking Integration unavailable");
    }

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

    if (this.cashFlowMonitor) {
      cashFlowRecords = this.cashFlowMonitor
        .getCashFlowRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Cash Flow Monitor unavailable");
    }

    return {
      payments,
      bankingRecords,
      transactions,
      revenues,
      expenses,
      cashFlowRecords,
      warnings,
    };
  }
}
