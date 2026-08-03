/** X3-07 — Profitability Analysis Engine (working capital / opex signals). */

import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FinancialScaleInput, FinancialScalingRecord } from "./types.js";
import {
  buildFinancialScalingRecord,
  computeFinancialSignals,
} from "./structural-signals.js";

export class ProfitabilityAnalysisEngine {
  assess(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
    focus: "working_capital" | "operating_expense" | "profitability" = "profitability",
  ): FinancialScalingRecord {
    const signals = computeFinancialSignals(focus, input, config);
    let summary: string;
    if (focus === "working_capital") {
      summary = `Working-capital structural score · investment efficiency ${signals.investmentEfficiencyScore} — ${signals.recommendationSummary}`;
    } else if (focus === "operating_expense") {
      summary = `Operating-expense structural score · investment efficiency ${signals.investmentEfficiencyScore} — ${signals.recommendationSummary}`;
    } else {
      summary = `Profitability ${signals.profitabilityScore} · ${signals.recommendationSummary}`;
    }
    return buildFinancialScalingRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
