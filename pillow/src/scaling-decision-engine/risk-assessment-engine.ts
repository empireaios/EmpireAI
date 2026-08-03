/** X3-03 — Risk Assessment Engine. */

import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type { ScalingDecisionInput, ScalingDecisionRecord } from "./types.js";
import { buildDecisionRecord, computeStructuralSignals } from "./structural-signals.js";

export class RiskAssessmentEngine {
  assess(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): ScalingDecisionRecord {
    const signals = computeStructuralSignals(input, config);
    return buildDecisionRecord(
      signals,
      0,
      `Business risk score ${signals.riskScore} for ${signals.productReference}`,
    );
  }
}
