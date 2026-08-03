/** X2-15 — Strategic Fit Analyzer. */

import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";

export class StrategicFitAnalyzer {
  evaluate(input: {
    industry: string;
    strategicFitHint?: number;
    config: AcquisitionEvaluationEngineConfiguration;
  }): number {
    if (!input.config.strategicFitRulesEnabled) {
      return Math.max(0, Math.min(100, input.strategicFitHint ?? 45));
    }
    const industryBoost =
      /tech|commerce|service|software|logistics/i.test(input.industry) ? 12 : 4;
    const base = input.strategicFitHint ?? 58;
    return Math.max(0, Math.min(100, Math.round(base + industryBoost - 5)));
  }
}
