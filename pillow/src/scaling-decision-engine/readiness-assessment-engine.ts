/** X3-03 — Readiness Assessment Engine. */

import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type { ScalingDecisionInput, ScalingDecisionRecord } from "./types.js";
import { buildDecisionRecord, computeStructuralSignals } from "./structural-signals.js";

export class ReadinessAssessmentEngine {
  assess(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): ScalingDecisionRecord {
    const signals = computeStructuralSignals(input, config);
    return buildDecisionRecord(
      signals,
      0,
      `Readiness ${signals.readinessScore} (product=${signals.productReadiness}, ops=${signals.operationalReadiness}, fin=${signals.financialReadiness}, supplier=${signals.supplierReadiness}, market=${signals.marketReadiness})`,
    );
  }
}
