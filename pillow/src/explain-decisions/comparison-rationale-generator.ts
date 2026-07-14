/** T4-06 — Generates rationale from side-by-side comparisons. */

import type { SideBySideComparisonRecord } from "../side-by-side-comparison/types.js";
import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";
import { appendExplanationLog } from "./explanation-logging.js";

export class ComparisonRationaleGenerator {
  generate(input: {
    comparison: SideBySideComparisonRecord | null;
    proposals: RedesignProposalRecord[];
    config: ExplainDecisionsConfiguration;
  }): string {
    appendExplanationLog({
      event: "comparison_rationale_generation",
      level: "info",
      details: "Generating comparison rationale",
    });

    if (!input.comparison) {
      return "No comparison record available — explain proposal rationale directly";
    }

    const parts: string[] = [
      `Compared ${input.comparison.comparedOptions.length} option(s) via ${input.comparison.comparisonType}`,
      input.comparison.differenceSummary,
    ];

    const markers = input.comparison.visualDifferenceMarkers.slice(0, 3);
    for (const m of markers) {
      parts.push(`${m.region}: ${m.description}`);
    }

    if (input.comparison.uxScoreDifferences.length > 0) {
      const ux = input.comparison.uxScoreDifferences[0];
      if (ux && ux.baselineValue !== null) {
        parts.push(`UX score baseline ${ux.baselineValue}`);
      }
    }

    const topProposal = input.proposals[0];
    if (topProposal && input.comparison.comparedOptions.length > 1) {
      parts.push(
        `Option differences may favor ${topProposal.proposalCategory} improvements when evidence supports it`,
      );
    }

    return parts.filter(Boolean).join("; ");
  }
}
