/** X2-15 — Risk Evaluation Engine (risk + operational maturity). */

import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";

export class RiskEvaluationEngine {
  evaluateRisk(input: {
    riskHint?: number;
    financialScore: number;
    strategicFitScore: number;
    config: AcquisitionEvaluationEngineConfiguration;
  }): number {
    if (!input.config.evaluationRulesEnabled) {
      return Math.max(0, Math.min(100, input.riskHint ?? 55));
    }
    const base = input.riskHint ?? 48;
    const offset =
      (100 - input.financialScore) * 0.15 + (100 - input.strategicFitScore) * 0.1;
    return Math.max(0, Math.min(100, Math.round(base + offset)));
  }

  evaluateOperationalMaturity(input: {
    operationalMaturityHint?: number;
    financialScore: number;
  }): number {
    const base = input.operationalMaturityHint ?? 55;
    return Math.max(
      0,
      Math.min(100, Math.round((base + input.financialScore) / 2 + 5)),
    );
  }
}
