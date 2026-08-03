/** X3-02 — Sales Velocity Analyzer. */

import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type { ProductAnalysisInput, ProductOpportunityRecord } from "./types.js";
import { buildOpportunityRecord, computeStructuralSignals } from "./structural-signals.js";

export class SalesVelocityAnalyzer {
  analyze(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): ProductOpportunityRecord {
    const signals = computeStructuralSignals(input, config);
    return buildOpportunityRecord(
      signals,
      0,
      `Sales velocity ${signals.salesVelocity} for ${signals.productReference}`,
    );
  }
}
