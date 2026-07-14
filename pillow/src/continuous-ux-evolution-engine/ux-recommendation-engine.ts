/** T5-07 — UX recommendation aggregation engine. */

import { appendEvolutionLog } from "./cue-logging.js";
import type { ContinuousUxEvolutionConfiguration } from "./configuration.js";
import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import { ContinuousImprovementEngine } from "./continuous-improvement-engine.js";
import { UxEvolutionEngine } from "./ux-evolution-engine.js";
import { UxTrendAnalyzer } from "./ux-trend-analyzer.js";
import type { ContinuousUxEvolutionEngineBundle, RawEvolutionCandidate } from "./types.js";

export class UxRecommendationEngine {
  private readonly uxEvolution = new UxEvolutionEngine();
  private readonly continuousImprovement = new ContinuousImprovementEngine();
  private readonly trendAnalyzer = new UxTrendAnalyzer();
  private readonly seenSignatures = new Set<string>();

  generate(input: {
    engines: ContinuousUxEvolutionEngineBundle;
    adaptiveRecords: AdaptiveInterfaceRecord[];
    evolutionRecords: WorkflowEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
    config: ContinuousUxEvolutionConfiguration;
  }): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    if (input.config.recommendationRulesEnabled) {
      candidates.push(
        ...this.continuousImprovement.discover({
          adaptiveRecords: input.adaptiveRecords,
        }),
      );
    }

    if (input.config.trendAnalysisRulesEnabled) {
      candidates.push(
        ...this.trendAnalyzer.analyze({
          evolutionRecords: input.evolutionRecords,
          productivityRecords: input.productivityRecords,
        }),
      );
    }

    if (input.config.recommendationRulesEnabled) {
      candidates.push(
        ...this.uxEvolution.evaluate({
          audit: input.audit,
          opportunities: input.opportunities,
          currentScreenId: input.currentScreenId,
          currentRouteOrViewId: input.currentRouteOrViewId,
        }),
      );
    }

    const filtered = input.config.deduplicateImprovements
      ? this.deduplicate(candidates)
      : candidates;

    if (filtered.length === 0) {
      filtered.push({
        evolutionCategory: "user_experience_evolution",
        recommendedUxImprovements: [
          "Apply baseline continuous UX evolution recommendations",
          "Monitor interface quality trends for incremental refinement",
        ],
        expectedUxBenefit: "Maintains ongoing UX optimization baseline",
        evidenceReferences: ["cue:baseline-evolution"],
        confidenceScore: 0.5,
        impactScore: 0.55,
        sourceEngine: "PILLOW-CUE-001",
      });
    }

    for (const c of filtered) {
      appendEvolutionLog({
        event: "improvement_discovery",
        level: "info",
        details: `${c.evolutionCategory}: ${c.recommendedUxImprovements[0]?.slice(0, 60) ?? "improvement"}`,
      });
    }

    return filtered;
  }

  resetForTesting(): void {
    this.seenSignatures.clear();
  }

  private deduplicate(candidates: RawEvolutionCandidate[]): RawEvolutionCandidate[] {
    const unique: RawEvolutionCandidate[] = [];
    for (const c of candidates) {
      const sig = `${c.evolutionCategory}:${c.recommendedUxImprovements[0]?.slice(0, 80) ?? ""}`;
      if (this.seenSignatures.has(sig)) continue;
      this.seenSignatures.add(sig);
      unique.push(c);
    }
    return unique;
  }
}
