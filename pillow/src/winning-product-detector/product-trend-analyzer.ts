/** X3-02 — Product Trend Analyzer. */

import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type { ProductAnalysisInput, ProductOpportunityRecord } from "./types.js";
import { buildOpportunityRecord, computeStructuralSignals } from "./structural-signals.js";

export class ProductTrendAnalyzer {
  analyze(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): ProductOpportunityRecord {
    const signals = computeStructuralSignals(input, config);
    return buildOpportunityRecord(
      signals,
      0,
      `Trend score ${signals.trendScore} for ${signals.productReference}`,
    );
  }
}
