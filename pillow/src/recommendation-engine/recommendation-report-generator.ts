/** T2-09 — Generates redesign proposals from opportunities. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";
import type { UxScoreRecord } from "../ux-scoring-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import { RecommendationMetadataGenerator } from "./recommendation-metadata-generator.js";
import { UxIssuePrioritizer } from "./ux-issue-prioritizer.js";
import { RecommendationEvidenceMapper } from "./recommendation-evidence-mapper.js";
import {
  mapOpportunityToCategory,
  buildExpectedBenefit,
} from "./recommendation-category-mapper.js";
import type { RedesignProposal, RecommendationCategory } from "./types.js";
import type { RecommendationEngineConfiguration } from "./configuration.js";
import { RECOMMENDATION_METADATA_VERSION } from "./paths.js";

export class RecommendationReportGenerator {
  private readonly metadata = new RecommendationMetadataGenerator();
  private readonly prioritizer = new UxIssuePrioritizer();
  private readonly evidenceMapper = new RecommendationEvidenceMapper();

  generateProposals(input: {
    opportunities: ImprovementOpportunity[];
    uxScore: UxScoreRecord | null;
    executiveStyle: ExecutiveStyleModel | null;
    designSystem: DesignSystemModel | null;
    screenId: string | null;
    routeOrViewId: string | null;
    config: RecommendationEngineConfiguration;
  }): RedesignProposal[] {
    const enabled = new Set(input.config.recommendationCategories);
    const prioritized = this.prioritizer.prioritize(input.opportunities, input.config);
    const proposals: RedesignProposal[] = [];
    const now = new Date().toISOString();

    for (const opp of prioritized) {
      if (opp.confidence < input.config.confidenceThreshold) continue;

      const category = mapOpportunityToCategory(opp);
      if (!enabled.has(category)) continue;

      const priority = this.prioritizer.toPriority(opp, input.config);
      const title = this.buildTitle(category, opp);
      const description = this.buildDescription(opp, category);

      let proposal: RedesignProposal = this.metadata.enrichProposal({
        recommendationId: this.metadata.buildProposalId(category),
        timestamp: now,
        screenId: input.screenId,
        routeOrViewId: input.routeOrViewId,
        recommendationCategory: category,
        recommendationTitle: title,
        recommendationDescription: description,
        affectedComponents: opp.affectedComponentId ? [opp.affectedComponentId] : [],
        affectedLayoutRegions: opp.affectedLayoutRegionId ? [opp.affectedLayoutRegionId] : [],
        affectedNavigationNodes: opp.affectedNavigationNodeId
          ? [opp.affectedNavigationNodeId]
          : [],
        sourceUxScoreId: input.uxScore?.uxScoreId ?? null,
        sourceFindingIds: [opp.sourceId],
        evidenceReferences: [opp.sourceId, `source:${opp.source}`],
        expectedUxBenefit: buildExpectedBenefit(opp, category),
        priority,
        severity: opp.severity,
        confidenceScore: Math.round(opp.confidence * 100),
        executivePreferenceAlignment: this.checkExecutiveAlignment(
          category,
          input.executiveStyle,
        ),
        designSystemAlignment: this.checkDesignSystemAlignment(category, input.designSystem),
        metadataVersion: RECOMMENDATION_METADATA_VERSION,
      });

      proposal = this.evidenceMapper.mapProposalEvidence(proposal, opp);
      proposals.push(proposal);

      if (proposals.length >= input.config.maxProposalsPerReport) break;
    }

    return proposals;
  }

  private buildTitle(category: RecommendationCategory, opp: ImprovementOpportunity): string {
    const labels: Partial<Record<RecommendationCategory, string>> = {
      layout_improvement: "Improve layout structure",
      component_improvement: "Improve component design",
      navigation_improvement: "Improve navigation clarity",
      workflow_improvement: "Reduce workflow friction",
      accessibility_improvement: "Improve accessibility",
      visual_consistency_improvement: "Align visual consistency",
      design_system_alignment: "Align with design system",
      executive_preference_alignment: "Align with executive preferences",
      form_usability_improvement: "Improve form usability",
      loading_state_improvement: "Improve loading feedback",
      empty_state_improvement: "Improve empty state guidance",
      error_state_improvement: "Improve error recovery",
    };
    return labels[category] ?? `Address ${opp.category.replace(/_/g, " ")} issue`;
  }

  private buildDescription(opp: ImprovementOpportunity, category: RecommendationCategory): string {
    return `${opp.description}. Proposed ${category.replace(/_/g, " ")} to improve EmpireAI UX quality.`;
  }

  private checkExecutiveAlignment(
    category: RecommendationCategory,
    style: ExecutiveStyleModel | null,
  ): boolean {
    if (!style) return false;
    if (category === "executive_preference_alignment") return true;
    return style.preferredConsistencyRules.length > 0;
  }

  private checkDesignSystemAlignment(
    category: RecommendationCategory,
    designSystem: DesignSystemModel | null,
  ): boolean {
    if (!designSystem) return false;
    return (
      category === "design_system_alignment" ||
      category === "visual_consistency_improvement" ||
      category === "component_improvement"
    );
  }
}
