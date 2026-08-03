/** X3-07 — Capital Planning Engine. */

import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FinancialScaleInput, FinancialScalingRecord } from "./types.js";
import {
  buildFinancialScalingRecord,
  computeFinancialSignals,
} from "./structural-signals.js";

export class CapitalPlanningEngine {
  assess(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FinancialScalingRecord {
    const signals = computeFinancialSignals("capital", input, config);
    const summary =
      signals.capitalRequirement < config.minCapitalRequirement
        ? `Capital ${signals.capitalRequirement} below min ${config.minCapitalRequirement} — hold financial scaling`
        : `Capital ${signals.capitalRequirement} within validated threshold — monitor headroom`;
    return buildFinancialScalingRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
