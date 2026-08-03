/** X4-11 — Brand Consistency Engine. */

import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import {
  buildBrandGovernanceRecord,
  computeStructuralBrandSignals,
} from "./structural-signals.js";
import type { BrandAnalysisInput, BrandGovernanceRecord } from "./types.js";

export class BrandConsistencyEngine {
  manageBrandConsistency(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandGovernanceRecord {
    const signals = computeStructuralBrandSignals(
      { ...input, brandCategory: "brand_consistency" },
      config,
    );
    return buildBrandGovernanceRecord({
      ...signals,
      recommendationSummary: `Manage brand consistency for ${signals.brandReference} (score=${signals.brandConsistencyScore})`,
    });
  }

  detectBrandInconsistencies(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandGovernanceRecord {
    const signals = computeStructuralBrandSignals(
      {
        ...input,
        brandCategory: "brand_inconsistency",
        inconsistencyHint: input.inconsistencyHint ?? true,
      },
      config,
    );
    return buildBrandGovernanceRecord(
      {
        ...signals,
        inconsistencyDetected: true,
        recommendationSummary: `Brand inconsistency detected for ${signals.brandReference} in ${signals.region}`,
      },
      "partial",
    );
  }

  inconsistencyCount(records: BrandGovernanceRecord[]): number {
    return records.filter((r) => r.inconsistencyDetected).length;
  }
}
