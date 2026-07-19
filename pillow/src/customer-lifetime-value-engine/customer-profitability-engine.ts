/** R4-15 — Customer Profitability Engine. */

import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";
import type { ProfitRecord } from "../profit-calculation-engine/types.js";

export class CustomerProfitabilityEngine {
  analyze(
    profitRecords: ProfitRecord[],
    revenueContribution: number,
    config: CustomerLifetimeValueEngineConfiguration,
  ): { profitContribution: number } {
    if (profitRecords.length > 0) {
      const profitContribution = profitRecords.reduce((sum, r) => sum + r.netProfit, 0);
      return { profitContribution: Math.max(0, Math.round(profitContribution * 100) / 100) };
    }

    const estimated = revenueContribution * config.defaultProfitMargin;
    return { profitContribution: Math.max(0, Math.round(estimated * 100) / 100) };
  }
}
