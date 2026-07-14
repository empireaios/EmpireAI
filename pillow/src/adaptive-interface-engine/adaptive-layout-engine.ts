/** T5-06 — Adaptive layout recommendations from T5-03 opportunities and audit. */

import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { DetectedContext } from "./context-detection-engine.js";
import type { RawAdaptationCandidate } from "./types.js";

export class AdaptiveLayoutEngine {
  recommend(input: {
    context: DetectedContext;
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
  }): RawAdaptationCandidate[] {
    const candidates: RawAdaptationCandidate[] = [];

    for (const opp of input.opportunities.filter((o) =>
      ["layout_improvement", "readability_improvement", "information_hierarchy_improvement"].includes(
        o.opportunityCategory,
      ),
    )) {
      candidates.push({
        adaptationCategory: "adaptive_layout",
        currentWorkflowContext: input.context.workflowContext,
        recommendedInterfaceAdaptations: [
          `Adapt layout for: ${opp.opportunitySummary}`,
          "Resize primary content region for current workflow",
        ],
        recommendedNavigationAdaptations: [],
        recommendedWorkspaceAdaptations: [
          "Rebalance panel proportions for current task focus",
        ],
        expectedProductivityBenefit: opp.expectedUxBenefit,
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.74,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
      });
    }

    const hierarchyIssues = (input.audit?.detectedUxIssues ?? []).filter(
      (i) => i.category === "hierarchy_issue" || i.category === "spacing_issue",
    );
    for (const issue of hierarchyIssues) {
      candidates.push({
        adaptationCategory: "adaptive_information_hierarchy",
        currentWorkflowContext: input.context.workflowContext,
        recommendedInterfaceAdaptations: [
          "Elevate primary actions in visual hierarchy",
          `Address: ${issue.description}`,
        ],
        recommendedNavigationAdaptations: [],
        recommendedWorkspaceAdaptations: [],
        expectedProductivityBenefit: "Improves scanability and task focus",
        evidenceReferences: [issue.evidenceReference],
        confidenceScore: issue.detectionConfidence,
        impactScore: 0.68,
        sourceEngine: issue.sourceEngine,
        sourceObservationId: input.audit?.sourceObservationId ?? null,
      });
    }

    return candidates;
  }
}
