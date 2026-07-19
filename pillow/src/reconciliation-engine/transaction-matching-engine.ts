/** R3-08 — Transaction matching engine. */

import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type { PaymentRecord } from "../payment-gateway-integration/types.js";
import type { BankingTransactionRecord } from "../banking-integration/types.js";
import type { RevenueRecord } from "../revenue-engine/types.js";
import type { ExpenseRecord } from "../expense-engine/types.js";
import type { CashFlowRecord } from "../cash-flow-monitor/types.js";

export type MatchResult = {
  matched: number;
  unmatched: number;
  differenceAmount: number;
  paymentReference: string | null;
  bankingReference: string | null;
  revenueReference: string | null;
  expenseReference: string | null;
  cashFlowReference: string | null;
};

export class TransactionMatchingEngine {
  private amountsClose(
    a: number,
    b: number,
    config: ReconciliationEngineConfiguration,
  ): boolean {
    return Math.abs(a - b) <= config.amountTolerance;
  }

  matchPaymentsToRevenue(
    payments: PaymentRecord[],
    revenues: RevenueRecord[],
    config: ReconciliationEngineConfiguration,
    filterPaymentId?: string,
  ): MatchResult {
    const captured = payments.filter(
      (p) =>
        p.paymentStatus === "captured" &&
        (!filterPaymentId || p.paymentId === filterPaymentId),
    );
    let matched = 0;
    let unmatched = 0;
    let differenceAmount = 0;
    let revenueReference: string | null = null;

    for (const payment of captured) {
      const revenue = revenues.find((r) => r.paymentReference === payment.paymentId);
      if (revenue && this.amountsClose(revenue.netRevenue, payment.paymentAmount, config)) {
        matched += 1;
        revenueReference = revenue.revenueRecordId;
      } else if (revenue) {
        unmatched += 1;
        differenceAmount += Math.abs(revenue.netRevenue - payment.paymentAmount);
        revenueReference = revenue.revenueRecordId;
      } else {
        unmatched += 1;
        differenceAmount += payment.paymentAmount;
      }
    }

    return {
      matched,
      unmatched,
      differenceAmount,
      paymentReference: captured[0]?.paymentId ?? filterPaymentId ?? null,
      bankingReference: null,
      revenueReference,
      expenseReference: null,
      cashFlowReference: null,
    };
  }

  matchBankingTransactions(
    transactions: BankingTransactionRecord[],
    payments: PaymentRecord[],
    revenues: RevenueRecord[],
    config: ReconciliationEngineConfiguration,
    filterBankingRef?: string,
  ): MatchResult {
    const accounts = filterBankingRef
      ? transactions.filter((t) => t.bankingRecordId.includes(filterBankingRef))
      : transactions;

    let matched = 0;
    let unmatched = 0;
    let differenceAmount = 0;

    for (const txn of accounts) {
      const paymentMatch = payments.find(
        (p) =>
          p.paymentStatus === "captured" &&
          this.amountsClose(p.paymentAmount, txn.amount, config),
      );
      const revenueMatch = revenues.find(
        (r) =>
          r.bankingReference &&
          this.amountsClose(r.netRevenue, txn.amount, config),
      );

      if (paymentMatch || revenueMatch) {
        matched += 1;
      } else if (txn.amount > 0) {
        unmatched += 1;
        differenceAmount += txn.amount;
      }
    }

    return {
      matched,
      unmatched,
      differenceAmount,
      paymentReference: null,
      bankingReference: filterBankingRef ?? accounts[0]?.bankingRecordId ?? null,
      revenueReference: null,
      expenseReference: null,
      cashFlowReference: null,
    };
  }

  matchRevenueRecords(
    revenues: RevenueRecord[],
    payments: PaymentRecord[],
    config: ReconciliationEngineConfiguration,
    filterRevenueId?: string,
  ): MatchResult {
    const filtered = filterRevenueId
      ? revenues.filter((r) => r.revenueRecordId === filterRevenueId)
      : revenues;

    let matched = 0;
    let unmatched = 0;
    let differenceAmount = 0;

    for (const revenue of filtered) {
      if (!revenue.paymentReference) {
        unmatched += 1;
        continue;
      }
      const payment = payments.find((p) => p.paymentId === revenue.paymentReference);
      if (payment && this.amountsClose(payment.paymentAmount, revenue.netRevenue, config)) {
        matched += 1;
      } else {
        unmatched += 1;
        differenceAmount += payment
          ? Math.abs(payment.paymentAmount - revenue.netRevenue)
          : revenue.netRevenue;
      }
    }

    return {
      matched,
      unmatched,
      differenceAmount,
      paymentReference: filtered[0]?.paymentReference ?? null,
      bankingReference: filtered[0]?.bankingReference ?? null,
      revenueReference: filtered[0]?.revenueRecordId ?? null,
      expenseReference: null,
      cashFlowReference: null,
    };
  }

  matchExpenseRecords(
    expenses: ExpenseRecord[],
    payments: PaymentRecord[],
    config: ReconciliationEngineConfiguration,
    filterExpenseId?: string,
  ): MatchResult {
    const filtered = filterExpenseId
      ? expenses.filter((e) => e.expenseRecordId === filterExpenseId)
      : expenses;

    let matched = 0;
    let unmatched = 0;
    let differenceAmount = 0;

    for (const expense of filtered) {
      if (!expense.paymentReference) {
        unmatched += 1;
        differenceAmount += expense.expenseAmount;
        continue;
      }
      const payment = payments.find((p) => p.paymentId === expense.paymentReference);
      if (payment && this.amountsClose(payment.paymentAmount, expense.expenseAmount, config)) {
        matched += 1;
      } else {
        unmatched += 1;
        differenceAmount += payment
          ? Math.abs(payment.paymentAmount - expense.expenseAmount)
          : expense.expenseAmount;
      }
    }

    return {
      matched,
      unmatched,
      differenceAmount,
      paymentReference: filtered[0]?.paymentReference ?? null,
      bankingReference: filtered[0]?.bankingReference ?? null,
      revenueReference: null,
      expenseReference: filtered[0]?.expenseRecordId ?? null,
      cashFlowReference: null,
    };
  }

  matchCashFlowRecords(
    cashFlowRecords: CashFlowRecord[],
    revenues: RevenueRecord[],
    expenses: ExpenseRecord[],
    config: ReconciliationEngineConfiguration,
    filterCashFlowId?: string,
  ): MatchResult {
    const filtered = filterCashFlowId
      ? cashFlowRecords.filter((c) => c.cashFlowRecordId === filterCashFlowId)
      : cashFlowRecords;

    const expectedNet =
      revenues.reduce((s, r) => s + r.netRevenue, 0) -
      expenses.reduce((s, e) => s + e.expenseAmount, 0);

    let matched = 0;
    let unmatched = 0;
    let differenceAmount = 0;

    for (const record of filtered) {
      if (this.amountsClose(record.netCashFlow, expectedNet, config)) {
        matched += 1;
      } else {
        unmatched += 1;
        differenceAmount += Math.abs(record.netCashFlow - expectedNet);
      }
    }

    return {
      matched,
      unmatched,
      differenceAmount,
      paymentReference: null,
      bankingReference: recordRef(filtered[0]?.bankingReference),
      revenueReference: recordRef(filtered[0]?.revenueReference),
      expenseReference: recordRef(filtered[0]?.expenseReference),
      cashFlowReference: filtered[0]?.cashFlowRecordId ?? null,
    };
  }
}

function recordRef(value: string | null | undefined): string | null {
  return value ?? null;
}
