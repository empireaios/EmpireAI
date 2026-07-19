/** X1-02 — Opportunity Validator. */

import { BOD_METADATA_VERSION, OPPORTUNITY_CATEGORIES } from "./paths.js";
import type { BusinessOpportunityDiscoveryConfiguration } from "./configuration.js";
import type {
  DiscoverOpportunitiesInput,
  OpportunityEngineRecord,
  OpportunityRecord,
  OpportunityValidationReport,
} from "./types.js";

export class OpportunityValidator {
  validateConfiguration(
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Business Opportunity Discovery disabled");
    if (!config.neverFabricateMarketInformation) {
      errors.push("Fabrication protection must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.minOpportunityScore < 0 || config.minOpportunityScore > 100) {
      errors.push("Min opportunity score must be between 0 and 100");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: OpportunityEngineRecord): OpportunityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("bod-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.dependencyPresence.companyFactoryFramework) {
      warnings.push("Company Factory Framework dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateDiscover(
    input: DiscoverOpportunitiesInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.category && !(OPPORTUNITY_CATEGORIES as readonly string[]).includes(input.category)) {
      errors.push(`Invalid opportunity category: ${input.category}`);
    }
    if (input.validated === false) {
      errors.push("Cannot run opportunity discovery without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateOpportunityRecord(record: OpportunityRecord): OpportunityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.opportunityId.startsWith("bod-opp-")) {
      errors.push("Invalid opportunity ID prefix");
    }
    if (record.fabricatedMarketInformation !== false) {
      errors.push("Fabricated market information is forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Opportunities must remain structural signals only");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.marketReference) warnings.push("Missing market reference");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): OpportunityValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `bod-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BOD_METADATA_VERSION,
    };
  }
}
