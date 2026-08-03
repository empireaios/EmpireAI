/** X3-02 — Breakout Detection Engine. */

import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type { ProductAnalysisInput, ProductOpportunityRecord } from "./types.js";
import { buildOpportunityRecord, computeStructuralSignals } from "./structural-signals.js";

export class BreakoutDetectionEngine {
  detectBreakouts(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): ProductOpportunityRecord {
    const signals = computeStructuralSignals(input, config);
    const summary =
      signals.opportunityClass === "breakout"
        ? `Breakout detected for ${signals.productReference}`
        : `No breakout for ${signals.productReference} · class=${signals.opportunityClass}`;
    return buildOpportunityRecord(signals, 0, summary);
  }

  detectDeclining(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): ProductOpportunityRecord {
    const signals = computeStructuralSignals(input, config);
    const summary =
      signals.opportunityClass === "declining"
        ? `Declining product detected for ${signals.productReference}`
        : `Not declining for ${signals.productReference} · class=${signals.opportunityClass}`;
    return buildOpportunityRecord(signals, 0, summary);
  }
}
