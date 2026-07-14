/** T5-03 — Opportunity record validation. */

import { randomUUID } from "node:crypto";
import { OPPORTUNITY_METADATA_VERSION } from "./paths.js";
import type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";
import type { OpportunityRecord, OpportunityValidationReport } from "./types.js";

export class OpportunityValidator {
  validate(
    opportunities: OpportunityRecord[],
    config: UxOpportunityDiscoveryConfiguration,
  ): OpportunityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const opp of opportunities) {
      if (!opp.opportunityId) errors.push("Missing opportunity ID");
      if (opp.discoverOnly !== true) errors.push("Opportunity must remain discover-only");
      if (opp.confidenceScore < config.confidenceThreshold) {
        warnings.push(
          `Opportunity ${opp.opportunityId} confidence below threshold`,
        );
      }
      if (!opp.evidenceReferences.length) {
        warnings.push(`Opportunity ${opp.opportunityId} lacks evidence references`);
      }
    }

    if (!opportunities.length) {
      warnings.push("No opportunities discovered in this cycle");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: randomUUID(),
      validationTimestamp: new Date().toISOString(),
      decision,
      opportunitiesValidated: opportunities.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OPPORTUNITY_METADATA_VERSION,
    };
  }
}
