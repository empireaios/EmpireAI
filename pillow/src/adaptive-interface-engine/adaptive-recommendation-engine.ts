/** T5-06 — Adaptive recommendation aggregation engine. */

import { AdaptiveLayoutEngine } from "./adaptive-layout-engine.js";
import { AdaptiveNavigationEngine } from "./adaptive-navigation-engine.js";
import { ContextDetectionEngine } from "./context-detection-engine.js";
import { WorkflowContextAnalyzer } from "./workflow-context-analyzer.js";
import { WorkspacePersonalizationEngine } from "./workspace-personalization-engine.js";
import type { AdaptiveInterfaceConfiguration } from "./configuration.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type {
  AdaptiveInterfaceEngineBundle,
  RawAdaptationCandidate,
} from "./types.js";
import { appendAdaptiveLog } from "./adaptive-logging.js";

export class AdaptiveRecommendationEngine {
  private readonly contextDetection = new ContextDetectionEngine();
  private readonly workflowAnalyzer = new WorkflowContextAnalyzer();
  private readonly layout = new AdaptiveLayoutEngine();
  private readonly navigation = new AdaptiveNavigationEngine();
  private readonly workspace = new WorkspacePersonalizationEngine();
  private readonly seenSignatures = new Set<string>();

  generate(input: {
    engines: AdaptiveInterfaceEngineBundle;
    evolutionRecords: WorkflowEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
    config: AdaptiveInterfaceConfiguration;
  }): {
    context: ReturnType<ContextDetectionEngine["detect"]>;
    candidates: RawAdaptationCandidate[];
    recurringPatterns: string[];
  } {
    const context = this.contextDetection.detect(input.engines);
    const candidates: RawAdaptationCandidate[] = [];

    if (input.config.adaptationRulesEnabled) {
      candidates.push(
        ...this.workflowAnalyzer.analyze({
          context,
          evolutionRecords: input.evolutionRecords,
          productivityRecords: input.productivityRecords,
        }),
      );
    }

    if (input.config.adaptationRulesEnabled) {
      candidates.push(
        ...this.layout.recommend({
          context,
          opportunities: input.opportunities,
          audit: input.audit,
        }),
      );
    }

    if (input.config.navigationAdaptationRulesEnabled) {
      candidates.push(
        ...this.navigation.recommend({
          context,
          evolutionRecords: input.evolutionRecords,
          opportunities: input.opportunities,
        }),
      );
    }

    let recurringPatterns: string[] = [];
    if (input.config.workspaceAdaptationRulesEnabled) {
      const workspace = this.workspace.recommend({
        engines: input.engines,
        context,
        productivityRecords: input.productivityRecords,
      });
      candidates.push(...workspace.candidates);
      recurringPatterns = workspace.recurringPatterns;
    }

    const filtered = input.config.deduplicateAdaptations
      ? this.deduplicate(candidates)
      : candidates;

    if (filtered.length === 0) {
      filtered.push({
        adaptationCategory: "adaptive_operational_context",
        currentWorkflowContext: context.workflowContext,
        recommendedInterfaceAdaptations: [
          "Apply baseline context-aware interface personalization",
        ],
        recommendedNavigationAdaptations: [
          "Align navigation with detected operational context",
        ],
        recommendedWorkspaceAdaptations: [
          "Organize workspace for current workflow context",
        ],
        expectedProductivityBenefit: "Provides context-aware UX baseline personalization",
        evidenceReferences: context.evidenceReferences,
        confidenceScore: Math.max(0.5, context.confidenceScore),
        impactScore: 0.55,
        sourceEngine: "PILLOW-AIE-001",
      });
    }

    for (const c of filtered) {
      appendAdaptiveLog({
        event: "adaptation_generation",
        level: "info",
        details: `${c.adaptationCategory}: ${c.currentWorkflowContext.slice(0, 60)}`,
      });
    }

    return { context, candidates: filtered, recurringPatterns };
  }

  resetForTesting(): void {
    this.seenSignatures.clear();
  }

  private deduplicate(candidates: RawAdaptationCandidate[]): RawAdaptationCandidate[] {
    const unique: RawAdaptationCandidate[] = [];
    for (const c of candidates) {
      const sig = `${c.adaptationCategory}:${c.currentWorkflowContext.slice(0, 80)}`;
      if (this.seenSignatures.has(sig)) continue;
      this.seenSignatures.add(sig);
      unique.push(c);
    }
    return unique;
  }
}
