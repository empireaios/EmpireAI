/** T4-06 — Accessibility rationale generator. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { SideBySideComparisonRecord } from "../side-by-side-comparison/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";

const A11Y_CATEGORIES = new Set([
  "accessibility_improvement",
  "form_improvement",
  "navigation_improvement",
]);

export class AccessibilityRationaleGenerator {
  generate(input: {
    proposals: RedesignProposalRecord[];
    comparison: SideBySideComparisonRecord | null;
    config: ExplainDecisionsConfiguration;
  }): string | null {
    if (!input.config.accessibilityExplanationRulesEnabled) return null;

    const a11yProposals = input.proposals.filter((p) =>
      A11Y_CATEGORIES.has(p.proposalCategory),
    );
    const parts: string[] = [];

    if (a11yProposals.length > 0) {
      parts.push(
        `${a11yProposals.length} proposal(s) target accessibility or inclusive interaction patterns`,
      );
      parts.push(a11yProposals[0]!.proposedUxChange.slice(0, 160));
    }

    const a11yDiff = input.comparison?.accessibilityDifferences?.[0];
    if (a11yDiff?.baselineValue !== null && a11yDiff?.baselineValue !== undefined) {
      parts.push(`Accessibility score baseline ${a11yDiff.baselineValue}`);
    }

    return parts.length > 0 ? parts.join("; ") : null;
  }
}
