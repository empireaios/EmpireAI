/** X3-07 — Cash Flow Analysis Engine. */

import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FinancialScaleInput, FinancialScalingRecord } from "./types.js";
import {
  buildFinancialScalingRecord,
  computeFinancialSignals,
} from "./structural-signals.js";

export class CashFlowAnalysisEngine {
  assess(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FinancialScalingRecord {
    const signals = computeFinancialSignals("cash_flow", input, config);
    let summary = signals.recommendationSummary;
    if (signals.cashFlowReadiness < config.minCashFlowReadiness) {
      summary = `Cash-flow readiness ${signals.cashFlowReadiness} below min ${config.minCashFlowReadiness} — do not scale`;
    } else if (signals.profitabilityScore < config.minProfitabilityScore) {
      summary = `Profitability ${signals.profitabilityScore} below min ${config.minProfitabilityScore} — stabilize finance first`;
    } else {
      summary = `Cash-flow ${signals.cashFlowReadiness} · profitability ${signals.profitabilityScore} within validated analytics bounds`;
    }
    return buildFinancialScalingRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
