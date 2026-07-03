/**
 * G7-05 — Advertising spend tracker.
 */

import type { AdvertisingRoiSummary } from "../contracts/financial-operations-types.js";
import { resolveFinancialOperationDependencies } from "../registry/financial-operations-registry-resolver.js";
import { listFinancialRecordsByDomain } from "./financial-ledger.js";
import { aggregateRevenue } from "./revenue-aggregation-engine.js";

export function trackAdvertisingSpend(context: { workspaceId?: string } = {}): AdvertisingRoiSummary {
  const deps = resolveFinancialOperationDependencies(context);
  const adRecords = listFinancialRecordsByDomain("advertising_spend");
  const totalSpend = adRecords.reduce((sum, r) => sum + Math.abs(r.netAmount), 0);
  const revenue = aggregateRevenue(context);
  const attributedRevenue = revenue.netRevenue * 0.4;
  const roi = totalSpend > 0 ? ((attributedRevenue - totalSpend) / totalSpend) * 100 : 0;

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    attributedRevenue: Math.round(attributedRevenue * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    currency: deps.defaultCurrency ?? "USD",
  };
}
