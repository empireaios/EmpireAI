/** R3-07 — Cash flow data source (consumes R3-03 through R3-06). */

import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";

export type CashFlowFinancialSnapshot = {
  openingBalance: number;
  cashInflow: number;
  cashOutflow: number;
  operatingCashFlow: number;
  bankingReference: string | null;
  revenueReference: string | null;
  expenseReference: string | null;
  warnings: string[];
};

export class CashFlowDataSource {
  constructor(
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
  ) {}

  snapshot(input: {
    bankingReference?: string;
    revenueReference?: string;
    expenseReference?: string;
    inflowsOnly?: boolean;
    outflowsOnly?: boolean;
  }): CashFlowFinancialSnapshot {
    const warnings: string[] = [];
    let openingBalance = 0;
    let bankingReference: string | null = input.bankingReference ?? null;

    if (this.bankingIntegration) {
      const accounts = this.bankingIntegration.getBankingRecords();
      const account = input.bankingReference
        ? accounts.find((a) => a.bankAccountReference === input.bankingReference)
        : accounts[0];
      if (account) {
        openingBalance = account.accountBalance;
        bankingReference = account.bankAccountReference;
      } else {
        warnings.push("Banking record not found");
      }
    } else {
      warnings.push("Banking Integration unavailable");
    }

    let cashInflow = 0;
    let revenueReference: string | null = input.revenueReference ?? null;
    if (!input.outflowsOnly && this.revenueEngine) {
      const revenues = this.revenueEngine
        .getRevenueRecords()
        .filter((r) => r.validationStatus === "passed");
      const filtered = input.revenueReference
        ? revenues.filter((r) => r.revenueRecordId === input.revenueReference)
        : revenues;
      cashInflow = filtered.reduce((s, r) => s + r.netRevenue, 0);
      revenueReference = filtered[0]?.revenueRecordId ?? null;
      if (filtered.length === 0) warnings.push("No matching revenue records");
    }

    let cashOutflow = 0;
    let expenseReference: string | null = input.expenseReference ?? null;
    if (!input.inflowsOnly && this.expenseEngine) {
      const expenses = this.expenseEngine
        .getExpenseRecords()
        .filter((r) => r.validationStatus === "passed");
      const filtered = input.expenseReference
        ? expenses.filter((r) => r.expenseRecordId === input.expenseReference)
        : expenses;
      cashOutflow = filtered.reduce((s, r) => s + r.expenseAmount, 0);
      expenseReference = filtered[0]?.expenseRecordId ?? null;
      if (filtered.length === 0) warnings.push("No matching expense records");
    }

    let operatingCashFlow = cashInflow - cashOutflow;
    if (this.profitCalculationEngine) {
      const profits = this.profitCalculationEngine.getProfitRecords();
      if (profits.length > 0) {
        operatingCashFlow = profits.reduce((s, p) => s + p.operatingProfit, 0);
      }
    }

    return {
      openingBalance,
      cashInflow,
      cashOutflow,
      operatingCashFlow,
      bankingReference,
      revenueReference,
      expenseReference,
      warnings,
    };
  }
}
