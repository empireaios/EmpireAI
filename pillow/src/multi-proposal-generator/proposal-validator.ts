/** T4-04 — Proposal output validation. */

import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import type {
  ProposalDecision,
  ProposalGenerationValidationReport,
  RedesignProposalRecord,
} from "./types.js";
import { ProposalMetadataGenerator } from "./proposal-metadata-generator.js";
import { appendProposalLog } from "./proposal-logging.js";
import { PROPOSAL_METADATA_VERSION } from "./paths.js";

export class ProposalValidator {
  private readonly metadata = new ProposalMetadataGenerator();

  validate(
    proposals: RedesignProposalRecord[],
    config: MultiProposalGeneratorConfiguration,
    extras?: { appliedChanges?: boolean; approvedChanges?: boolean },
  ): ProposalGenerationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", proposals, errors, warnings, started);
    }

    if (proposals.length === 0) {
      errors.push("No proposals generated");
      return this.buildReport("fail", proposals, errors, warnings, started);
    }

    if (proposals.length < config.minimumProposalCount) {
      warnings.push(
        `Generated ${proposals.length} proposals below minimum ${config.minimumProposalCount}`,
      );
    }
    if (proposals.length > config.maximumProposalCount) {
      errors.push(`Exceeded maximum proposal count ${config.maximumProposalCount}`);
    }

    const categories = new Set(proposals.map((p) => p.proposalCategory));
    if (config.proposalDiversityRulesEnabled && categories.size < 2 && proposals.length > 2) {
      warnings.push("Low category diversity in proposal set");
    }

    for (const p of proposals) {
      if (!p.proposalTitle || !p.proposedUxChange) {
        errors.push(`Proposal ${p.proposalId} missing required fields`);
      }
      if (p.confidenceScore < config.confidenceThreshold) {
        warnings.push(`Proposal ${p.proposalId} below confidence threshold`);
      }
    }

    if (extras?.appliedChanges) {
      errors.push("Multi-proposal generator must not apply UX changes automatically");
    }
    if (extras?.approvedChanges) {
      errors.push("Multi-proposal generator must not approve changes automatically");
    }

    let decision: ProposalDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    appendProposalLog({
      event: "validation_results",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()} · ${proposals.length} proposals`,
    });

    return this.buildReport(decision, proposals, errors, warnings, started);
  }

  private buildReport(
    decision: ProposalDecision,
    proposals: RedesignProposalRecord[],
    errors: string[],
    warnings: string[],
    started: number,
  ): ProposalGenerationValidationReport {
    const categories = new Set(proposals.map((p) => p.proposalCategory));
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      proposalsGenerated: proposals.length,
      categoriesCovered: categories.size,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PROPOSAL_METADATA_VERSION,
    };
  }
}
