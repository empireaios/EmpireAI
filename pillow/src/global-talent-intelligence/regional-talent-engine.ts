/** X4-13 — Regional Talent Engine. */

import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import {
  buildWorkforceRecord,
  computeStructuralWorkforceSignals,
} from "./structural-signals.js";
import type { WorkforceAnalysisInput, WorkforceIntelligenceRecord } from "./types.js";

export class RegionalTalentEngine {
  monitorRegionalTalentMarkets(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceIntelligenceRecord {
    if (!config.regionalWorkforceRulesEnabled) {
      throw new Error("Regional workforce rules disabled");
    }
    const signals = computeStructuralWorkforceSignals(
      { ...input, workforceCategory: "regional_talent_market" },
      config,
    );
    return buildWorkforceRecord({
      ...signals,
      recommendationSummary: `Monitor regional talent market in ${signals.region}`,
    });
  }
}
