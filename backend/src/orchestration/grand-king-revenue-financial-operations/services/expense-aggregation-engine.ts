/**
 * G7-05 — Expense aggregation engine.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { FinancialRecord } from "../contracts/financial-operations-types.js";
import { listFinancialRecords } from "./financial-ledger.js";

export type ExpenseAggregationResult = {
  totalExpenses: number;
  expensesByDomain: Record<string, number>;
  operationalExpenses: number;
  supplierCosts: number;
  advertisingSpend: number;
  shippingCosts: number;
  recordCount: number;
  computedAt: string;
};

const EXPENSE_TYPES = new Set(["expense", "advertising", "fee", "tax"]);

export function aggregateExpenses(_context: RegistryLoaderContext = {}): ExpenseAggregationResult {
  const expenseRecords = listFinancialRecords().filter((r) => EXPENSE_TYPES.has(r.transactionType));

  const expensesByDomain: Record<string, number> = {};
  for (const record of expenseRecords) {
    expensesByDomain[record.domainId] = (expensesByDomain[record.domainId] ?? 0) + record.netAmount;
  }

  const sumDomain = (domainId: string) => expensesByDomain[domainId] ?? 0;

  return {
    totalExpenses: expenseRecords.reduce((sum, r) => sum + Math.abs(r.netAmount), 0),
    expensesByDomain,
    operationalExpenses: sumDomain("operational_cost"),
    supplierCosts: sumDomain("supplier_cost"),
    advertisingSpend: sumDomain("advertising_spend"),
    shippingCosts: sumDomain("shipping_cost"),
    recordCount: expenseRecords.length,
    computedAt: new Date().toISOString(),
  };
}

export function filterExpenseRecords(records: FinancialRecord[]): FinancialRecord[] {
  return records.filter((r) => EXPENSE_TYPES.has(r.transactionType));
}
