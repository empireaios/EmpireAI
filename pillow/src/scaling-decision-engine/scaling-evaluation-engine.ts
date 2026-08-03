/** X3-03 — Scaling Evaluation Engine. */

import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type { ScalingDecisionInput, ScalingDecisionRecord } from "./types.js";
import { buildDecisionRecord, computeStructuralSignals } from "./structural-signals.js";

export class ScalingEvaluationEngine {
  evaluate(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): ScalingDecisionRecord {
    const signals = computeStructuralSignals(input, config);
    return buildDecisionRecord(
      signals,
      0,
      `Candidate evaluated for ${signals.productReference} · readiness=${signals.readinessScore} · risk=${signals.riskScore}`,
    );
  }
}
