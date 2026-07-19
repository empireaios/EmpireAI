/** R4-15 — CLV Calculation Engine. */

import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";
import type { CustomerFinancialSignals } from "./types.js";

export class ClvCalculationEngine {
  calculate(
    signals: CustomerFinancialSignals,
    config: CustomerLifetimeValueEngineConfiguration,
  ): { lifetimeValue: number } {
    if (!config.clvCalculationRulesEnabled) {
      return { lifetimeValue: signals.revenueContribution };
    }

    let lifetimeValue = 0;
    for (const rule of config.clvCalculationRules) {
      if (!rule.enabled) continue;
      if (rule.ruleId === "revenue_weight") {
        lifetimeValue += signals.revenueContribution * rule.weight;
      }
      if (rule.ruleId === "profit_weight") {
        lifetimeValue += signals.profitContribution * rule.weight;
      }
      if (rule.ruleId === "retention_weight") {
        lifetimeValue += (signals.retentionScore / 100) * signals.averageOrderValue * rule.weight;
      }
    }

    return { lifetimeValue: Math.max(0, Math.round(lifetimeValue * 100) / 100) };
  }
}
