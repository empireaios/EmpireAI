/**
 * G7-05 — Subscription tracker.
 */

import type { SubscriptionMetricsSummary } from "../contracts/financial-operations-types.js";
import { resolveFinancialOperationDependencies } from "../registry/financial-operations-registry-resolver.js";
import { listFinancialRecordsByDomain } from "./financial-ledger.js";

export function trackSubscriptions(context: { workspaceId?: string } = {}): SubscriptionMetricsSummary {
  const deps = resolveFinancialOperationDependencies(context);
  const subscriptionRecords = listFinancialRecordsByDomain("subscription_revenue");
  const active = subscriptionRecords.filter((r) => r.status === "completed" || r.status === "reconciled");
  const mrr = active.reduce((sum, r) => sum + r.netAmount, 0);
  const failed = subscriptionRecords.filter((r) => r.status === "failed" || r.status === "cancelled").length;
  const churnRate =
    subscriptionRecords.length > 0 ? Math.round((failed / subscriptionRecords.length) * 10000) / 100 : 0;

  return {
    mrr: Math.round(mrr * 100) / 100,
    activeSubscriptions: active.length,
    churnRate,
    currency: deps.defaultCurrency ?? "USD",
  };
}
