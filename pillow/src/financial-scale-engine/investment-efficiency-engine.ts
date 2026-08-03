/** X3-07 — Investment Efficiency Engine. */

import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FinancialScaleInput, FinancialScalingRecord } from "./types.js";
import {
  buildFinancialScalingRecord,
  computeFinancialSignals,
} from "./structural-signals.js";

export class InvestmentEfficiencyEngine {
  assess(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FinancialScalingRecord {
    const signals = computeFinancialSignals("investment_efficiency", input, config);
    return buildFinancialScalingRecord({ ...signals, config });
  }
}
