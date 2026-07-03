/**
 * G7-05 — Financial KPI engine.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { FinancialKpiSnapshot } from "../contracts/financial-operations-types.js";
import { resolveFinancialOperationDependencies } from "../registry/financial-operations-registry-resolver.js";
import { trackAdvertisingSpend } from "./advertising-spend-tracker.js";
import { aggregateExpenses } from "./expense-aggregation-engine.js";
import { listFinancialRecords } from "./financial-ledger.js";
import { computeProfitability } from "./profitability-engine.js";
import { trackPayouts } from "./payout-tracker.js";
import { trackRefunds } from "./refund-tracker.js";
import { aggregateRevenue } from "./revenue-aggregation-engine.js";
import { trackSubscriptions } from "./subscription-tracker.js";

export function aggregateFinancialKpis(context: RegistryLoaderContext = {}): FinancialKpiSnapshot {
  const deps = resolveFinancialOperationDependencies(context);
  const revenue = aggregateRevenue(context);
  const expenses = aggregateExpenses(context);
  const profitability = computeProfitability(context);
  const subscriptions = trackSubscriptions(context);
  const advertising = trackAdvertisingSpend(context);
  const refunds = trackRefunds();
  const payouts = trackPayouts();

  const outstandingPayouts = payouts.payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);

  const cashRecords = listFinancialRecords().filter((r) => r.domainId === "cash_position");
  const cashAvailable =
    cashRecords.reduce((sum, r) => sum + r.netAmount, 0) || profitability.netProfit * 0.8;

  return {
    grossRevenue: Math.round(revenue.grossRevenue * 100) / 100,
    netRevenue: Math.round(revenue.netRevenue * 100) / 100,
    grossProfit: Math.round(profitability.grossProfit * 100) / 100,
    netProfit: Math.round(profitability.netProfit * 100) / 100,
    profitMargin: profitability.profitMargin,
    subscriptionMrr: subscriptions.mrr,
    advertisingRoi: advertising.roi,
    refundRate: refunds.refundRate,
    chargebackRate: refunds.chargebackRate,
    cashAvailable: Math.round(cashAvailable * 100) / 100,
    outstandingPayouts: Math.round(outstandingPayouts * 100) / 100,
    operationalExpenses: Math.round(expenses.operationalExpenses * 100) / 100,
    currency: deps.defaultCurrency ?? "USD",
    computedAt: new Date().toISOString(),
    policyReference: deps.financialPolicy,
  };
}
