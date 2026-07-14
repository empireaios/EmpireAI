/** T5-09 — Core UX learning aggregation. */

import { appendLearningLog } from "./siux-logging.js";
import type { SelfImprovingUxConfiguration } from "./configuration.js";
import type { ApprovalRecord } from "../approval-workflow/types.js";
import type { ChangeDocumentationRecord } from "../change-documentation/types.js";
import type { WorkspaceIntelligenceRecord } from "../executive-workspace-intelligence-engine/types.js";
import type { UxEvolutionRecord } from "../continuous-ux-evolution-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import { OutcomeAnalysisEngine } from "./outcome-analysis-engine.js";
import { RedesignLearningEngine } from "./redesign-learning-engine.js";
import { RecommendationImprovementEngine } from "./recommendation-improvement-engine.js";
import { PrioritizationImprovementEngine } from "./prioritization-improvement-engine.js";
import type { RawLearningCandidate } from "./types.js";

export class UxLearningEngine {
  private readonly redesign = new RedesignLearningEngine();
  private readonly outcomes = new OutcomeAnalysisEngine();
  private readonly recommendationImprovement = new RecommendationImprovementEngine();
  private readonly prioritizationImprovement = new PrioritizationImprovementEngine();
  private readonly seenSignatures = new Set<string>();

  learn(input: {
    workspaceRecords: WorkspaceIntelligenceRecord[];
    uxEvolutionRecords: UxEvolutionRecord[];
    evolutionRecords: WorkflowEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
    approvals: ApprovalRecord[];
    changeRecords: ChangeDocumentationRecord[];
    audit: UxAuditRecord | null;
    config: SelfImprovingUxConfiguration;
  }): RawLearningCandidate[] {
    const candidates: RawLearningCandidate[] = [];

    if (input.config.learningRulesEnabled) {
      candidates.push(
        ...this.redesign.learn({
          workspaceRecords: input.workspaceRecords,
          uxEvolutionRecords: input.uxEvolutionRecords,
          changeRecords: input.changeRecords,
        }),
        ...this.outcomes.analyze({
          approvals: input.approvals,
          changeRecords: input.changeRecords,
          audit: input.audit,
          evolutionRecords: input.evolutionRecords,
          productivityRecords: input.productivityRecords,
        }),
      );
    }

    if (input.config.recommendationImprovementRulesEnabled) {
      candidates.push(...this.recommendationImprovement.improve(candidates));
    }

    if (input.config.prioritizationImprovementRulesEnabled) {
      candidates.push(...this.prioritizationImprovement.improve(candidates));
    }

    const filtered = input.config.deduplicateLearnings
      ? this.deduplicate(candidates)
      : candidates;

    if (filtered.length === 0) {
      filtered.push({
        learningCategory: "continuous_ux_intelligence_learning",
        learnedUxInsight: "Baseline UX learning from accumulated T5 intelligence",
        improvementSummary: "Maintain autonomous UX growth from validated evidence",
        recommendationImprovement: "Apply baseline learning weights to future UX recommendations",
        prioritizationImprovement: "Apply baseline learning weights to future prioritization",
        sourceRedesignHistory: [],
        sourceDeploymentOutcomes: [],
        sourceApprovalHistory: [],
        evidenceReferences: ["siux:baseline-learning"],
        confidenceScore: 0.5,
        impactScore: 0.55,
        sourceEngine: "PILLOW-SIUX-001",
      });
    }

    for (const c of filtered) {
      appendLearningLog({
        event: "recommendation_improvement",
        level: "info",
        details: `${c.learningCategory}: ${c.learnedUxInsight.slice(0, 60)}`,
      });
    }

    return filtered;
  }

  resetForTesting(): void {
    this.seenSignatures.clear();
  }

  private deduplicate(candidates: RawLearningCandidate[]): RawLearningCandidate[] {
    const unique: RawLearningCandidate[] = [];
    for (const c of candidates) {
      const sig = `${c.learningCategory}:${c.learnedUxInsight.slice(0, 80)}`;
      if (this.seenSignatures.has(sig)) continue;
      this.seenSignatures.add(sig);
      unique.push(c);
    }
    return unique;
  }
}
