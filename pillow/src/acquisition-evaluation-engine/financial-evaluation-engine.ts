/** X2-15 — Financial Evaluation Engine. */

import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";

export class FinancialEvaluationEngine {
  evaluate(input: {
    financialHint?: number;
    estimatedValueHint?: number;
    config: AcquisitionEvaluationEngineConfiguration;
  }): { financialScore: number; estimatedAcquisitionValue: number } {
    if (!input.config.evaluationRulesEnabled) {
      return {
        financialScore: Math.max(0, Math.min(100, input.financialHint ?? 40)),
        estimatedAcquisitionValue: Math.max(0, input.estimatedValueHint ?? 0),
      };
    }
    const financialScore = Math.max(
      0,
      Math.min(100, Math.round(input.financialHint ?? 62)),
    );
    const estimatedAcquisitionValue = Math.max(
      0,
      Math.round(
        input.estimatedValueHint ??
          250_000 + financialScore * 8_000 + (financialScore > 70 ? 100_000 : 0),
      ),
    );
    return { financialScore, estimatedAcquisitionValue };
  }
}
