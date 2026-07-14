/** T4-06 — Analyzes design tradeoffs across proposals. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { SideBySideComparisonRecord } from "../side-by-side-comparison/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";
import { appendExplanationLog } from "./explanation-logging.js";

export class TradeoffAnalyzer {
  analyze(input: {
    proposals: RedesignProposalRecord[];
    comparison: SideBySideComparisonRecord | null;
    config: ExplainDecisionsConfiguration;
    targetProposalId?: string | null;
  }): string {
    if (!input.config.tradeoffAnalysisRulesEnabled) {
      return "Tradeoff analysis disabled by configuration";
    }

    appendExplanationLog({
      event: "tradeoff_analysis",
      level: "info",
      details: "Analyzing design tradeoffs",
    });

    const target =
      input.proposals.find((p) => p.proposalId === input.targetProposalId) ??
      input.proposals[0];
    if (!target) return "No proposals available for tradeoff analysis";

    const parts: string[] = [];
    parts.push(
      `Scope: ${target.estimatedImplementationScope} — ${target.riskNotes ?? "no elevated risk noted"}`,
    );

    const altCount = input.proposals.length - 1;
    if (altCount > 0) {
      parts.push(
        `${altCount} alternative option(s) offer different category emphasis and confidence levels`,
      );
    }

    if (input.comparison?.differenceSummary) {
      parts.push(`Comparison notes: ${input.comparison.differenceSummary.slice(0, 200)}`);
    }

    const confidenceSpread =
      input.proposals.length > 1
        ? Math.max(...input.proposals.map((p) => p.confidenceScore)) -
          Math.min(...input.proposals.map((p) => p.confidenceScore))
        : 0;
    if (confidenceSpread > 0.15) {
      parts.push(
        "Confidence varies across options — review evidence before selecting a direction",
      );
    }

    return parts.join("; ");
  }
}
