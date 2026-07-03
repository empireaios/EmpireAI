/**
 * G7-05 — Executive finance dashboard backend.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type {
  CashPositionSummary,
  FinancialRiskRegister,
} from "../contracts/financial-operations-types.js";
import { aggregateFinancialKpis } from "./financial-kpi-engine.js";
import { listFinancialRecords } from "./financial-ledger.js";
import { computeProfitability } from "./profitability-engine.js";
import { trackAdvertisingSpend } from "./advertising-spend-tracker.js";
import { trackPayouts } from "./payout-tracker.js";
import { trackSubscriptions } from "./subscription-tracker.js";
import { aggregateRevenue } from "./revenue-aggregation-engine.js";
import { aggregateExpenses } from "./expense-aggregation-engine.js";

export function buildExecutiveFinanceDashboard(context: RegistryLoaderContext = {}) {
  const kpis = aggregateFinancialKpis(context);
  const profitability = computeProfitability(context);
  const revenue = aggregateRevenue(context);
  const expenses = aggregateExpenses(context);
  const payouts = trackPayouts();
  const subscriptions = trackSubscriptions(context);
  const advertising = trackAdvertisingSpend(context);
  const records = listFinancialRecords();

  return {
    kpis,
    profitability,
    revenue,
    expenses,
    payouts,
    subscriptions,
    advertising,
    records,
    domains: 13,
    computedAt: new Date().toISOString(),
  };
}

export function getCashPosition(context: RegistryLoaderContext = {}): CashPositionSummary {
  const kpis = aggregateFinancialKpis(context);
  const payouts = trackPayouts();
  const pendingReceivables = listFinancialRecords()
    .filter((r) => r.status === "pending" || r.status === "processing")
    .filter((r) => r.transactionType === "revenue")
    .reduce((sum, r) => sum + r.netAmount, 0);

  return {
    cashAvailable: kpis.cashAvailable,
    outstandingPayouts: kpis.outstandingPayouts,
    pendingReceivables: Math.round(pendingReceivables * 100) / 100,
    currency: kpis.currency,
    computedAt: new Date().toISOString(),
  };
}

export function buildFinancialRiskRegister(context: RegistryLoaderContext = {}): FinancialRiskRegister {
  const records = listFinancialRecords();
  const risks: FinancialRiskRegister["risks"] = [];

  for (const record of records) {
    if (record.status === "requires_review" || record.status === "failed" || record.status === "blocked") {
      risks.push({
        riskId: `risk-${record.financialRecordId}`,
        domainId: record.domainId,
        severity: record.status === "failed" ? "high" : "medium",
        summary: `Financial record ${record.financialRecordId} in ${record.status} state`,
        anomalyRef: `anomaly:${record.domainId}:${record.status}`,
      });
    }
  }

  if (process.env.FINANCIAL_ANOMALY_SIGNAL === "true") {
    risks.push({
      riskId: "risk-anomaly-signal",
      domainId: "net_profit",
      severity: "critical",
      summary: "Financial anomaly signal detected via environment governance hook",
      anomalyRef: "anomaly:net_profit:critical",
    });
  }

  const kpis = aggregateFinancialKpis(context);
  if (kpis.refundRate > 5) {
    risks.push({
      riskId: "risk-elevated-refunds",
      domainId: "refunds",
      severity: "high",
      summary: `Elevated refund rate: ${kpis.refundRate}%`,
      anomalyRef: "anomaly:refunds:elevated",
    });
  }

  return { riskCount: risks.length, risks };
}

export function getExecutiveFinancialSummary(context: RegistryLoaderContext = {}): string {
  const kpis = aggregateFinancialKpis(context);
  const profitability = computeProfitability(context);
  return [
    `Grand King financial operations — ${kpis.currency} net profit ${profitability.netProfit}.`,
    `Gross revenue ${kpis.grossRevenue}, net revenue ${kpis.netRevenue}, margin ${kpis.profitMargin}%.`,
    `Cash available ${kpis.cashAvailable}, outstanding payouts ${kpis.outstandingPayouts}.`,
    `Subscription MRR ${kpis.subscriptionMrr}, advertising ROI ${kpis.advertisingRoi}%.`,
  ].join(" ");
}
