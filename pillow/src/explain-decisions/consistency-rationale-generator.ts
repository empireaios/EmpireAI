/** T4-06 — Visual consistency rationale generator. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { SideBySideComparisonRecord } from "../side-by-side-comparison/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";

const CONSISTENCY_CATEGORIES = new Set([
  "theme_refresh",
  "component_redesign",
  "layout_redesign",
  "visual_consistency_improvement",
]);

export class ConsistencyRationaleGenerator {
  generate(input: {
    proposals: RedesignProposalRecord[];
    comparison: SideBySideComparisonRecord | null;
    config: ExplainDecisionsConfiguration;
  }): string | null {
    if (!input.config.consistencyExplanationRulesEnabled) return null;

    const consistencyProposals = input.proposals.filter((p) =>
      CONSISTENCY_CATEGORIES.has(p.proposalCategory),
    );
    const parts: string[] = [];

    if (consistencyProposals.length > 0) {
      parts.push(
        `${consistencyProposals.length} option(s) address visual consistency across components and layout`,
      );
    }

    const diff = input.comparison?.consistencyDifferences?.[0];
    if (diff?.baselineValue !== null && diff?.baselineValue !== undefined) {
      parts.push(`Consistency score baseline ${diff.baselineValue}`);
    }

    return parts.length > 0 ? parts.join("; ") : null;
  }
}
