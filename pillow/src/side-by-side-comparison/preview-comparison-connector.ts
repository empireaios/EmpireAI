/** T4-05 — Connects comparison to T3-05 preview builds. */

import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { SideBySideComparisonConfiguration } from "./configuration.js";
import type { ComparedOption } from "./types.js";
import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class PreviewComparisonConnector {
  private readonly metadata = new ComparisonMetadataGenerator();

  buildOptions(input: {
    proposals: RedesignProposalRecord[];
    includeOriginal: boolean;
    config: SideBySideComparisonConfiguration;
    previewGenerator: PreviewGenerator | null;
    uiStateMapperScreenId: string | null;
  }): { options: ComparedOption[]; previewBuildIds: string[] } {
    appendComparisonLog({
      event: "preview_loading",
      level: "info",
      details: "Linking preview builds to comparison options",
    });

    const previewBuildIds: string[] = [];
    let previewRecords: Array<{ previewBuildId: string; previewTargetScreenId: string }> = [];

    if (input.config.previewLinkageRulesEnabled && input.previewGenerator) {
      try {
        const report = input.previewGenerator.getLatestReport?.() ?? null;
        previewRecords =
          report?.records?.map((r) => ({
            previewBuildId: r.previewBuildId,
            previewTargetScreenId: r.previewTargetScreenId,
          })) ?? [];
        previewBuildIds.push(...previewRecords.map((r) => r.previewBuildId));
      } catch {
        appendComparisonLog({
          event: "preview_loading",
          level: "warn",
          details: "Preview generator data unavailable",
        });
      }
    }

    const options: ComparedOption[] = [];
    let index = 0;

    if (input.includeOriginal) {
      options.push({
        optionId: this.metadata.buildOptionId(index++),
        label: "Original",
        proposalId: null,
        previewBuildId: previewRecords[0]?.previewBuildId ?? null,
        proposalCategory: "baseline",
        layoutReference: input.uiStateMapperScreenId
          ? `screen:${input.uiStateMapperScreenId}`
          : "original-layout",
      });
    }

    const maxProposals = input.includeOriginal
      ? Math.max(1, input.config.maximumComparedOptions - 1)
      : input.config.maximumComparedOptions;

    for (const proposal of input.proposals.slice(0, maxProposals)) {
      const preview =
        previewRecords.find((p) => p.previewTargetScreenId === proposal.targetScreenId) ??
        previewRecords[index % Math.max(previewRecords.length, 1)];
      options.push({
        optionId: this.metadata.buildOptionId(index++),
        label: proposal.proposalTitle.slice(0, 60),
        proposalId: proposal.proposalId,
        previewBuildId: preview?.previewBuildId ?? null,
        proposalCategory: proposal.proposalCategory,
        layoutReference: proposal.targetScreenId
          ? `screen:${proposal.targetScreenId}`
          : `proposal:${proposal.proposalId}`,
      });
    }

    return { options, previewBuildIds: [...new Set(previewBuildIds)] };
  }
}
