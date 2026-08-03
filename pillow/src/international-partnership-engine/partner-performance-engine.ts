/** X4-12 — Partner Performance Engine. */

import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import {
  buildPartnershipRecord,
  computeStructuralPartnershipSignals,
} from "./structural-signals.js";
import type { PartnershipAnalysisInput, PartnershipRecord } from "./types.js";

export class PartnerPerformanceEngine {
  monitorPartnerPerformance(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecord {
    const signals = computeStructuralPartnershipSignals(
      { ...input, partnershipCategory: "partner_performance" },
      config,
    );
    return buildPartnershipRecord(
      {
        ...signals,
        recommendationSummary: `Monitor partner performance for ${signals.partnerReference} (score=${signals.performanceScore})`,
      },
      signals.performanceScore < config.performanceThreshold ? "partial" : "passed",
    );
  }

  monitorPartnerReliability(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecord {
    const signals = computeStructuralPartnershipSignals(
      { ...input, partnershipCategory: "partner_reliability" },
      config,
    );
    return buildPartnershipRecord(
      {
        ...signals,
        recommendationSummary: `Monitor partner reliability for ${signals.partnerReference} (score=${signals.reliabilityScore})`,
      },
      signals.reliabilityScore < config.performanceThreshold ? "partial" : "passed",
    );
  }
}
