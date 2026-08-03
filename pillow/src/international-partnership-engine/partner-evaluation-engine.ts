/** X4-12 — Partner Evaluation Engine. */

import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import {
  buildPartnershipRecord,
  computeStructuralPartnershipSignals,
} from "./structural-signals.js";
import type { PartnershipAnalysisInput, PartnershipRecord } from "./types.js";

export class PartnerEvaluationEngine {
  evaluateProspectivePartners(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecord {
    if (!config.partnerEvaluationRulesEnabled) {
      throw new Error("Partner evaluation rules disabled");
    }
    const signals = computeStructuralPartnershipSignals(
      { ...input, partnershipCategory: "prospective_partner" },
      config,
    );
    return buildPartnershipRecord(
      {
        ...signals,
        recommendationSummary: `Evaluate prospective partner ${signals.partnerReference} in ${signals.country}`,
      },
      signals.approvalStatus === "approved_validated" ? "passed" : "partial",
    );
  }
}
