/** X4-11 — Brand Governance Engine. */

import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import {
  buildBrandGovernanceRecord,
  computeStructuralBrandSignals,
} from "./structural-signals.js";
import type { BrandAnalysisInput, BrandGovernanceRecord } from "./types.js";

export class BrandGovernanceEngine {
  manageWorldwideIdentity(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandGovernanceRecord {
    if (!config.brandGovernanceRulesEnabled) {
      throw new Error("Brand governance rules disabled");
    }
    const signals = computeStructuralBrandSignals(
      { ...input, brandCategory: "worldwide_identity" },
      config,
    );
    return buildBrandGovernanceRecord({
      ...signals,
      recommendationSummary: `Manage worldwide brand identity for ${signals.brandReference}`,
    });
  }

  monitorBrandCompliance(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandGovernanceRecord {
    const signals = computeStructuralBrandSignals(
      { ...input, brandCategory: "brand_compliance" },
      config,
    );
    return buildBrandGovernanceRecord({
      ...signals,
      recommendationSummary: `Monitor brand compliance for ${signals.brandReference} in ${signals.region} (status=${signals.complianceStatus})`,
    });
  }
}
