/** X3-02 — Demand Intelligence Engine. */

import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type { ProductAnalysisInput, ProductOpportunityRecord } from "./types.js";
import { buildOpportunityRecord, computeStructuralSignals } from "./structural-signals.js";

export class DemandIntelligenceEngine {
  analyze(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): ProductOpportunityRecord {
    const signals = computeStructuralSignals(input, config);
    return buildOpportunityRecord(
      signals,
      0,
      `Demand score ${signals.demandScore} for ${signals.productReference}`,
    );
  }
}
