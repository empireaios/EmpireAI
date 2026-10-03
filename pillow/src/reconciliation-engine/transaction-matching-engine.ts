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
  private minorUnits(amount: number, config: ReconciliationEngineConfiguration): number {
    if (!Intl.supportedValuesOf("currency").includes(config.defaultCurrency)) throw new Error("Unsupported reconciliation currency");
    const digits = new Intl.NumberFormat("en", {style:"currency",currency:config.defaultCurrency}).resolvedOptions().maximumFractionDigits!;
    const scaled = amount * 10 ** digits;
    const minor = Math.round(scaled);
    if (!Number.isFinite(amount) || !Number.isSafeInteger(minor) || Math.abs(scaled-minor)>1e-6)
      throw new Error("Reconciliation requires finite exact minor-unit amounts");
    return minor;
  }

  private requireCurrency(currency: string, config: ReconciliationEngineConfiguration): void {
    if (currency !== config.defaultCurrency) throw new Error("Reconciliation requires segregated currencies or explicit conversion evidence");
  }

  private amountsClose(a:number,b:number,config:ReconciliationEngineConfiguration):boolean {
    // A tolerance must never erase unexplained variance into a matched receipt.
    return this.minorUnits(a,config) === this.minorUnits(b,config);
  }

  private addDifference(total:number,amount:number,config:ReconciliationEngineConfiguration):number {
    const units=this.minorUnits(total,config)+this.minorUnits(Math.abs(amount),config);
    if(!Number.isSafeInteger(units))throw new Error("Reconciliation amount overflow");
    const digits = new Intl.NumberFormat("en", {style:"currency",currency:config.defaultCurrency}).resolvedOptions().maximumFractionDigits!;
    return units / 10 ** digits;
  }

  matchPaymentsToRevenue(
    payments: PaymentRecord[],
    revenues: RevenueRecord[],
    config: ReconciliationEngineConfiguration,
    filterPaymentId?: string,
  ): MatchResult {
    const captured = payments.filter(
      (p) =>
        p.paymentStatus === "captured" && p.direction !== "outbound" &&
        (!filterPaymentId || p.paymentId === filterPaymentId),
    );
    let matched = 0;
    let unmatched = 0;
    let differenceAmount = 0;
    let revenueReference: string | null = null;

    for (const payment of captured) {
      this.requireCurrency(payment.currency,config);this.minorUnits(payment.paymentAmount,config);
      const candidates=revenues.filter(r=>r.paymentReference===payment.paymentId);
      const revenue=candidates.length===1&&captured.filter(p=>p.paymentId===payment.paymentId).length===1?candidates[0]:undefined;
      if(revenue)this.requireCurrency(revenue.currency,config);
      if (revenue && revenue.validationStatus === "passed" && payment.validationStatus === "passed" && this.amountsClose(revenue.netRevenue, payment.paymentAmount, config)) {
        matched += 1;
        revenueReference = revenue.revenueRecordId;
      } else if (revenue) {
        unmatched += 1;
        differenceAmount = this.addDifference(differenceAmount,Math.abs(revenue.netRevenue - payment.paymentAmount),config);
        revenueReference = revenue.revenueRecordId;
      } else {
        unmatched += 1;
        differenceAmount = this.addDifference(differenceAmount,payment.paymentAmount,config);
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
      ? transactions.filter((t) => t.bankingRecordId === filterBankingRef)
      : transactions;

    let matched = 0;
    let unmatched = 0;
    let differenceAmount = 0;

    for (const txn of accounts) {
      this.requireCurrency(txn.currency,config);this.minorUnits(txn.amount,config);
      // Amount/account similarity is not transaction identity. Debits need an
      // expense/outbound-payment path; this path only supports receipt credits.
      const paymentLinks=payments.filter(p=>p.bankTransactionReference===txn.transactionId);
      const revenueLinks=revenues.filter(r=>r.bankTransactionReference===txn.transactionId);
      const unique=accounts.filter(t=>t.transactionId===txn.transactionId).length===1;
      const payment=paymentLinks.length===1&&revenueLinks.length===0?paymentLinks[0]:undefined;
      const revenue=revenueLinks.length===1&&paymentLinks.length===0?revenueLinks[0]:undefined;
      if(payment)this.requireCurrency(payment.currency,config);
      if(revenue)this.requireCurrency(revenue.currency,config);
      const amount=payment?.paymentAmount??revenue?.netRevenue;
      const valid=payment?payment.paymentStatus==="captured"&&payment.direction!=="outbound"&&payment.validationStatus==="passed":revenue?.validationStatus==="passed";
      if(unique&&txn.transactionType==="credit"&&valid&&amount!==undefined&&this.amountsClose(amount,txn.amount,config))matched++;
      else {unmatched++;differenceAmount=this.addDifference(differenceAmount,txn.amount,config);}
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
      this.requireCurrency(revenue.currency,config);this.minorUnits(revenue.netRevenue,config);
      if (!revenue.paymentReference) {
        unmatched += 1;
        continue;
      }
      const candidates=payments.filter(p=>p.paymentId===revenue.paymentReference&&p.paymentStatus==="captured"&&p.direction!=="outbound"&&p.validationStatus==="passed");
      const payment=candidates.length===1&&filtered.filter(r=>r.paymentReference===revenue.paymentReference).length===1?candidates[0]:undefined;
      if(payment)this.requireCurrency(payment.currency,config);
      if (payment && revenue.validationStatus === "passed" && this.amountsClose(payment.paymentAmount, revenue.netRevenue, config)) {
        matched += 1;
      } else {
        unmatched += 1;
        differenceAmount = this.addDifference(differenceAmount,payment
          ? Math.abs(payment.paymentAmount - revenue.netRevenue)
          : revenue.netRevenue,config);
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
      this.requireCurrency(expense.currency,config);this.minorUnits(expense.expenseAmount,config);
      if (!expense.paymentReference) {
        unmatched += 1;
        differenceAmount = this.addDifference(differenceAmount,expense.expenseAmount,config);
        continue;
      }
      const candidates=payments.filter(p=>p.paymentId===expense.paymentReference&&p.paymentStatus==="captured"&&p.direction==="outbound"&&p.validationStatus==="passed");
      const payment=candidates.length===1&&filtered.filter(e=>e.paymentReference===expense.paymentReference).length===1?candidates[0]:undefined;
      if(payment)this.requireCurrency(payment.currency,config);
      if (payment && expense.validationStatus === "passed" && this.amountsClose(payment.paymentAmount, expense.expenseAmount, config)) {
        matched += 1;
      } else {
        unmatched += 1;
        differenceAmount = this.addDifference(differenceAmount,payment
          ? Math.abs(payment.paymentAmount - expense.expenseAmount)
          : expense.expenseAmount,config);
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

    for(const revenue of revenues)this.requireCurrency(revenue.currency,config);
    for(const expense of expenses)this.requireCurrency(expense.currency,config);
    const netUnits=revenues.reduce((sum,r)=>sum+BigInt(this.minorUnits(r.netRevenue,config)),0n)-
      expenses.reduce((sum,e)=>sum+BigInt(this.minorUnits(e.expenseAmount,config)),0n);
    if(netUnits>BigInt(Number.MAX_SAFE_INTEGER)||netUnits<BigInt(Number.MIN_SAFE_INTEGER))throw new Error("Reconciliation amount overflow");
    const digits=new Intl.NumberFormat("en",{style:"currency",currency:config.defaultCurrency}).resolvedOptions().maximumFractionDigits!;
    const expectedNet=Number(netUnits)/10**digits;

    let matched = 0;
    let unmatched = 0;
    let differenceAmount = 0;

    for (const record of filtered) {
      if (revenues.length+expenses.length>0 && this.amountsClose(record.netCashFlow, expectedNet, config)) {
        matched += 1;
      } else {
        unmatched += 1;
        differenceAmount = this.addDifference(differenceAmount,Math.abs(record.netCashFlow - expectedNet),config);
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
