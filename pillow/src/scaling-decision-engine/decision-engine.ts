/** X3-03 — Decision Engine (scale / hold / reject). */

import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type { ScalingDecisionInput, ScalingDecisionRecord } from "./types.js";
import { buildDecisionRecord, computeStructuralSignals } from "./structural-signals.js";

export class DecisionEngine {
  decide(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): ScalingDecisionRecord {
    const signals = computeStructuralSignals(input, config);
    const summary =
      signals.decision === "scale"
        ? `SCALE ${signals.productReference} · confidence=${signals.scalingConfidence}`
        : signals.decision === "reject"
          ? `REJECT ${signals.productReference} · readiness=${signals.readinessScore} · risk=${signals.riskScore}`
          : `HOLD ${signals.productReference} · await stronger readiness or lower risk`;
    return buildDecisionRecord(signals, 0, summary);
  }
}
