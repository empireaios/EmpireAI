/** X2-17 — Maturity Assessment Engine. */

import type { CompanyLifecycleManagerConfiguration } from "./configuration.js";
import type { LifecycleStage } from "./types.js";

export class MaturityAssessmentEngine {
  assess(input: {
    maturityHint?: number;
    currentStage: LifecycleStage;
    config: CompanyLifecycleManagerConfiguration;
  }): number {
    if (!input.config.maturityAssessmentRulesEnabled) {
      return Math.max(0, Math.min(100, input.maturityHint ?? 40));
    }
    const stageBias: Record<LifecycleStage, number> = {
      launch: 25,
      growth: 50,
      mature: 75,
      retirement: 15,
    };
    const base = input.maturityHint ?? stageBias[input.currentStage];
    return Math.max(0, Math.min(100, Math.round(base)));
  }
}
