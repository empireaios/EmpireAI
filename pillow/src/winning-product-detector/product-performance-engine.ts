/** X3-02 — Product Performance Engine. */

import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type { ProductAnalysisInput, ProductOpportunityRecord } from "./types.js";
import { buildOpportunityRecord, computeStructuralSignals } from "./structural-signals.js";

export class ProductPerformanceEngine {
  monitor(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): ProductOpportunityRecord {
    const signals = computeStructuralSignals(input, config);
    return buildOpportunityRecord(
      signals,
      0,
      `Performance monitored for ${signals.productReference} · structural signal only`,
    );
  }
}
