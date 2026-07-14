/** T4-05 — Loads and prepares proposals from T4-04 for comparison. */

import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { SideBySideComparisonConfiguration } from "./configuration.js";
import type { ComparisonInput } from "./types.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class ProposalComparisonEngine {
  load(input: {
    comparisonInput: ComparisonInput;
    config: SideBySideComparisonConfiguration;
    multiProposalGenerator: MultiProposalGeneratorEngine | null;
  }): {
    proposals: RedesignProposalRecord[];
    targetScreenId: string | null;
    targetRouteOrViewId: string | null;
  } {
    appendComparisonLog({
      event: "proposal_loading",
      level: "info",
      details: "Loading proposals for comparison",
    });

    let proposals: RedesignProposalRecord[] = [];

    if (input.multiProposalGenerator) {
      try {
        const report = input.multiProposalGenerator.getLatestReport?.() ?? null;
        proposals = report?.proposals ?? [];
      } catch {
        appendComparisonLog({
          event: "proposal_loading",
          level: "warn",
          details: "Multi-proposal generator data unavailable",
        });
      }
    }

    if (input.comparisonInput.proposalIds?.length) {
      const ids = new Set(input.comparisonInput.proposalIds);
      proposals = proposals.filter((p) => ids.has(p.proposalId));
    }

    const includeOriginal =
      input.comparisonInput.includeOriginal ??
      input.comparisonInput.comparisonType === "original_vs_proposal";
    const maxProposals = includeOriginal
      ? Math.max(1, input.config.maximumComparedOptions - 1)
      : input.config.maximumComparedOptions;

    proposals = proposals.slice(0, maxProposals);

    if (proposals.length === 0) {
      throw new Error("No proposal records available for comparison");
    }

    const targetScreenId = proposals[0]?.targetScreenId ?? null;
    const targetRouteOrViewId = proposals[0]?.targetRouteOrViewId ?? null;

    return { proposals, targetScreenId, targetRouteOrViewId };
  }
}
