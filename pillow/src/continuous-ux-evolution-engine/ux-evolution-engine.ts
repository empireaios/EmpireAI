/** T5-07 — UX quality evaluation from audit and observation records. */

import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { RawEvolutionCandidate } from "./types.js";

export class UxEvolutionEngine {
  evaluate(input: {
    audit: UxAuditRecord | null;
    opportunities: OpportunityRecord[];
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
  }): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    for (const issue of input.audit?.detectedUxIssues ?? []) {
      const category = this.mapIssueToCategory(issue.category);
      if (!category) continue;
      candidates.push({
        evolutionCategory: category,
        recommendedUxImprovements: [
          `Resolve UX issue: ${issue.description}`,
          "Refine interface presentation for sustained quality",
        ],
        expectedUxBenefit: "Improves interface quality and user confidence",
        evidenceReferences: [issue.evidenceReference],
        confidenceScore: issue.detectionConfidence,
        impactScore: 0.72,
        sourceEngine: issue.sourceEngine,
        sourceOpportunityId: null,
      });
    }

    for (const opp of input.opportunities.filter((o) =>
      ["accessibility_improvement", "visual_consistency_improvement", "component_improvement"].includes(
        o.opportunityCategory,
      ),
    )) {
      const category = this.mapOpportunityToCategory(opp.opportunityCategory);
      candidates.push({
        evolutionCategory: category,
        recommendedUxImprovements: [
          `Evolve UX for: ${opp.opportunitySummary}`,
          "Apply incremental interface refinement",
        ],
        expectedUxBenefit: opp.expectedUxBenefit,
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.7,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
      });
    }

    return candidates;
  }

  private mapIssueToCategory(
    category: string,
  ): RawEvolutionCandidate["evolutionCategory"] | null {
    if (category === "accessibility_issue") return "accessibility_evolution";
    if (category === "consistency_issue") return "visual_consistency_evolution";
    if (category === "hierarchy_issue" || category === "spacing_issue") return "layout_evolution";
    if (category === "navigation_issue") return "navigation_evolution";
    if (category === "component_issue") return "component_evolution";
    return "user_experience_evolution";
  }

  private mapOpportunityToCategory(
    category: string,
  ): RawEvolutionCandidate["evolutionCategory"] {
    if (category === "accessibility_improvement") return "accessibility_evolution";
    if (category === "visual_consistency_improvement") return "visual_consistency_evolution";
    if (category === "component_improvement") return "component_evolution";
    return "user_experience_evolution";
  }
}
