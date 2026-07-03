/**
 * G7-05 — Profitability engine.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ProfitabilityReport } from "../contracts/financial-operations-types.js";
import { resolveFinancialOperationDependencies } from "../registry/financial-operations-registry-resolver.js";
import { aggregateExpenses } from "./expense-aggregation-engine.js";
import { aggregateRevenue } from "./revenue-aggregation-engine.js";

export function computeProfitability(context: RegistryLoaderContext = {}): ProfitabilityReport {
  const deps = resolveFinancialOperationDependencies(context);
  const revenue = aggregateRevenue(context);
  const expenses = aggregateExpenses(context);

  const grossProfit = revenue.grossRevenue - expenses.supplierCosts - expenses.shippingCosts;
  const netProfit = revenue.netRevenue - expenses.totalExpenses;
  const profitMargin = revenue.grossRevenue > 0 ? (netProfit / revenue.grossRevenue) * 100 : 0;
  const projectedProfit = netProfit * 1.1;

  return {
    grossRevenue: revenue.grossRevenue,
    totalExpenses: expenses.totalExpenses,
    grossProfit,
    netProfit,
    profitMargin: Math.round(profitMargin * 100) / 100,
    projectedProfit: Math.round(projectedProfit * 100) / 100,
    currency: deps.defaultCurrency ?? "USD",
    computedAt: new Date().toISOString(),
  };
}
