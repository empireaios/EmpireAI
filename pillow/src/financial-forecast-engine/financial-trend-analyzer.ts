/** R3-13 — Financial trend analyzer. */

import { FCT_METADATA_VERSION } from "./paths.js";
import type { ForecastFinancialSnapshot } from "./forecast-data-source.js";
import type { FinancialTrend } from "./types.js";

export class FinancialTrendAnalyzer {
  analyze(snapshot: ForecastFinancialSnapshot): FinancialTrend[] {
    const trends: FinancialTrend[] = [];
    const ts = new Date().toISOString();

    const revenueTotal = snapshot.revenues.reduce((s, r) => s + r.netRevenue, 0);
    const expenseTotal = snapshot.expenses.reduce((s, e) => s + e.expenseAmount, 0);
    const profitTotal = snapshot.profits.reduce((s, p) => s + p.netProfit, 0);
    const cashFlowTotal = snapshot.cashFlows.reduce((s, c) => s + c.netCashFlow, 0);
    const liquidity = snapshot.cashFlows[snapshot.cashFlows.length - 1]?.closingBalance ?? 0;

    const metrics: Array<{
      metric: FinancialTrend["metric"];
      value: number;
    }> = [
      { metric: "revenue", value: revenueTotal },
      { metric: "expense", value: expenseTotal },
      { metric: "profit", value: profitTotal },
      { metric: "cash_flow", value: cashFlowTotal },
      { metric: "liquidity", value: liquidity },
    ];

    for (const m of metrics) {
      const direction: FinancialTrend["direction"] =
        m.value > 0 ? "up" : m.value < 0 ? "down" : "stable";
      trends.push({
        trendId: `fct-trend-${Date.now()}-${m.metric}`,
        timestamp: ts,
        metric: m.metric,
        direction,
        changePercent: Math.abs(m.value) > 0 ? 100 : 0,
        description: `${m.metric} trend ${direction} based on ${snapshot.revenues.length + snapshot.expenses.length} historical records`,
        metadataVersion: FCT_METADATA_VERSION,
      });
    }

    return trends;
  }
}
