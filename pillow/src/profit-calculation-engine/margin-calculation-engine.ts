/** R3-06 — Margin calculation engine. */

import type { ProfitCalculationEngineConfiguration } from "./configuration.js";

export type MarginResult = {
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  profitMargin: number;
};

export class MarginCalculationEngine {
  calculate(input: {
    grossRevenue: number;
    netRevenue: number;
    directCosts: number;
    operatingExpenses: number;
    totalExpenses: number;
  }, config: ProfitCalculationEngineConfiguration): MarginResult {
    if (!config.marginCalculationRulesEnabled) {
      const netProfit = input.netRevenue - input.totalExpenses;
      return {
        grossProfit: input.grossRevenue - input.directCosts,
        operatingProfit: netProfit,
        netProfit,
        profitMargin: input.grossRevenue > 0 ? (netProfit / input.grossRevenue) * 100 : 0,
      };
    }

    const grossProfit = input.grossRevenue - input.directCosts;
    const operatingProfit = grossProfit - input.operatingExpenses;
    const netProfit = input.netRevenue - input.totalExpenses;
    const profitMargin =
      input.grossRevenue > 0 ? Math.round((netProfit / input.grossRevenue) * 10000) / 100 : 0;

    return { grossProfit, operatingProfit, netProfit, profitMargin };
  }
}
