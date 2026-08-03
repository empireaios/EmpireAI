/** X3-16 — Revenue Opportunity Engine. */

import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type { RevenueAccelerationRecord, RevenueAccelerationInput } from "./types.js";
import {
  buildRevenueAccelerationRecord,
  computeRevenueAccelerationSignals,
} from "./structural-signals.js";

export class RevenueOpportunityEngine {
  identify(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    sourceAvailable = true,
  ): RevenueAccelerationRecord {
    if (!config.revenueOpportunityIdentificationEnabled) {
      throw new Error("Revenue opportunity identification disabled");
    }
    const signals = computeRevenueAccelerationSignals(
      "revenue_acceleration_opportunities",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.revenueOpportunityScore >= config.revenueOpportunityThreshold
        ? `Identified revenue acceleration opportunity ${signals.revenueOpportunityScore}% for ${signals.companyReference} · ${signals.revenueCategory} — structural signals only`
        : signals.recommendationSummary;
    return buildRevenueAccelerationRecord({
      ...signals,
      recommendationSummary: summary,
    });
  }
}
