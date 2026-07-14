/** T4-06 — Links explanations to UX intelligence evidence. */

import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";
import type { EvidenceReference } from "./types.js";
import { ExplanationMetadataGenerator } from "./explanation-metadata-generator.js";
import { appendExplanationLog } from "./explanation-logging.js";

export class UxEvidenceLinker {
  private readonly metadata = new ExplanationMetadataGenerator();

  link(input: {
    proposals: RedesignProposalRecord[];
    config: ExplainDecisionsConfiguration;
    uxScoring: UxScoringEngine | null;
    recommendationEngine: RecommendationEngine | null;
    validationEngine: ValidationEngine | null;
    previewGenerator: PreviewGenerator | null;
  }): {
    evidence: EvidenceReference[];
    uxFindingIds: string[];
    uxScoreIds: string[];
    recommendationIds: string[];
    weakNotes: string[];
  } {
    appendExplanationLog({
      event: "evidence_linkage",
      level: "info",
      details: "Linking UX evidence to explanation",
    });

    const evidence: EvidenceReference[] = [];
    const uxFindingIds = new Set<string>();
    const uxScoreIds: string[] = [];
    const recommendationIds: string[] = [];
    const weakNotes: string[] = [];

    for (const proposal of input.proposals) {
      for (const findingId of proposal.linkedUxFindingIds) {
        uxFindingIds.add(findingId);
        evidence.push({
          evidenceId: this.metadata.buildEvidenceId(),
          evidenceType: "ux_finding",
          sourceId: findingId,
          summary: `UX finding linked to proposal ${proposal.proposalId}`,
          strength: "moderate",
        });
      }
    }

    if (input.config.uxScoreExplanationRulesEnabled && input.uxScoring) {
      try {
        const report = input.uxScoring.getLatestReport?.() ?? null;
        if (report?.record) {
          uxScoreIds.push(report.record.uxScoreId);
          evidence.push({
            evidenceId: this.metadata.buildEvidenceId(),
            evidenceType: "ux_score",
            sourceId: report.record.uxScoreId,
            summary: `Overall UX score ${report.record.overallUxScore}`,
            strength: report.record.confidenceScore >= 0.6 ? "strong" : "moderate",
          });
        } else {
          weakNotes.push("UX score data unavailable");
        }
      } catch {
        weakNotes.push("UX scoring engine unavailable");
      }
    }

    if (input.recommendationEngine) {
      try {
        const record = input.recommendationEngine.getLatestRecord?.() ?? null;
        if (record) {
          recommendationIds.push(record.recommendationRecordId);
          for (const rec of record.proposals.slice(0, 5)) {
            recommendationIds.push(rec.recommendationId);
            for (const findingId of rec.sourceFindingIds) uxFindingIds.add(findingId);
            evidence.push({
              evidenceId: this.metadata.buildEvidenceId(),
              evidenceType: "recommendation",
              sourceId: rec.recommendationId,
              summary: rec.recommendationTitle.slice(0, 120),
              strength: rec.confidenceScore >= 0.6 ? "strong" : "moderate",
            });
          }
        } else {
          weakNotes.push("Recommendation records unavailable");
        }
      } catch {
        weakNotes.push("Recommendation engine unavailable");
      }
    }

    if (input.validationEngine) {
      try {
        const report = input.validationEngine.getLatestReport?.() ?? null;
        for (const r of report?.reports?.slice(0, 3) ?? []) {
          evidence.push({
            evidenceId: this.metadata.buildEvidenceId(),
            evidenceType: "validation_report",
            sourceId: r.validationReportId,
            summary: `Validation ${r.validationStatus}`,
            strength: r.validationStatus === "validated" ? "strong" : "moderate",
          });
        }
      } catch {
        weakNotes.push("Validation reports unavailable");
      }
    }

    if (input.previewGenerator) {
      try {
        const report = input.previewGenerator.getLatestReport?.() ?? null;
        for (const r of report?.records?.slice(0, 3) ?? []) {
          evidence.push({
            evidenceId: this.metadata.buildEvidenceId(),
            evidenceType: "preview_build",
            sourceId: r.previewBuildId,
            summary: `Preview build ${r.previewScope}`,
            strength: r.buildStatus === "validated" ? "strong" : "moderate",
          });
        }
      } catch {
        weakNotes.push("Preview builds unavailable");
      }
    }

    if (evidence.length === 0) {
      evidence.push({
        evidenceId: this.metadata.buildEvidenceId(),
        evidenceType: "partial_context",
        sourceId: null,
        summary: "Limited upstream evidence — rationale based on proposal content only",
        strength: "weak",
      });
      weakNotes.push("No strong upstream evidence available");
    }

    return {
      evidence,
      uxFindingIds: [...uxFindingIds],
      uxScoreIds,
      recommendationIds: [...new Set(recommendationIds)],
      weakNotes,
    };
  }
}
