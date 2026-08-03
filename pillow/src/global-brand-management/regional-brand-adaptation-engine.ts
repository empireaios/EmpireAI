/** X4-11 — Regional Brand Adaptation Engine. */

import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import {
  buildBrandGovernanceRecord,
  computeStructuralBrandSignals,
} from "./structural-signals.js";
import type { BrandAnalysisInput, BrandGovernanceRecord } from "./types.js";

export class RegionalBrandAdaptationEngine {
  manageRegionalAdaptations(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandGovernanceRecord {
    if (!config.regionalAdaptationRulesEnabled) {
      throw new Error("Regional adaptation rules disabled");
    }
    const signals = computeStructuralBrandSignals(
      { ...input, brandCategory: "regional_adaptation" },
      config,
    );
    return buildBrandGovernanceRecord({
      ...signals,
      recommendationSummary: `Manage regional brand adaptation for ${signals.brandReference} in ${signals.region}`,
    });
  }
}
