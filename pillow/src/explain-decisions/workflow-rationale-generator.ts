/** T4-06 — Workflow rationale generator. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { SideBySideComparisonRecord } from "../side-by-side-comparison/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";

const WORKFLOW_CATEGORIES = new Set([
  "workflow_improvement",
  "navigation_improvement",
  "dashboard_improvement",
]);

export class WorkflowRationaleGenerator {
  generate(input: {
    proposals: RedesignProposalRecord[];
    comparison: SideBySideComparisonRecord | null;
    config: ExplainDecisionsConfiguration;
  }): string | null {
    if (!input.config.workflowExplanationRulesEnabled) return null;

    const workflowProposals = input.proposals.filter((p) =>
      WORKFLOW_CATEGORIES.has(p.proposalCategory),
    );
    const parts: string[] = [];

    if (workflowProposals.length > 0) {
      parts.push(
        `${workflowProposals.length} proposal(s) optimize task flow and navigation efficiency`,
      );
      parts.push(workflowProposals[0]!.expectedUxBenefit.slice(0, 160));
    }

    const diff = input.comparison?.workflowDifferences?.[0];
    if (diff?.baselineValue !== null && diff?.baselineValue !== undefined) {
      parts.push(`Workflow score baseline ${diff.baselineValue}`);
    }

    return parts.length > 0 ? parts.join("; ") : null;
  }
}
