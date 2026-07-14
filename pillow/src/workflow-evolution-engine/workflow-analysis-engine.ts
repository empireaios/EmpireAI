/** T5-05 — Workflow Analysis Engine — aggregates all evolution analyzers. */

import { appendEvolutionLog } from "./workflow-logging.js";
import { NavigationOptimizationEngine } from "./navigation-optimization-engine.js";
import { ProductivityImprovementEngine } from "./productivity-improvement-engine.js";
import { WorkflowFrictionDetector } from "./workflow-friction-detector.js";
import { WorkflowSimplificationEngine } from "./workflow-simplification-engine.js";
import type { WorkflowEvolutionConfiguration } from "./configuration.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { RawEvolutionCandidate } from "./types.js";

export class WorkflowAnalysisEngine {
  private readonly friction = new WorkflowFrictionDetector();
  private readonly simplification = new WorkflowSimplificationEngine();
  private readonly navigation = new NavigationOptimizationEngine();
  private readonly productivity = new ProductivityImprovementEngine();
  private readonly seenSignatures = new Set<string>();

  analyze(input: {
    productivityRecords: ProductivityIntelligenceRecord[];
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
    observation: ObservationRecord | null;
    config: WorkflowEvolutionConfiguration;
  }): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    if (input.config.frictionDetectionRulesEnabled) {
      candidates.push(
        ...this.friction.detect({
          productivityRecords: input.productivityRecords,
          opportunities: input.opportunities,
          audit: input.audit,
        }),
        ...this.simplification.analyze(input.productivityRecords),
        ...this.navigation.analyze({
          productivityRecords: input.productivityRecords,
          opportunities: input.opportunities,
          observation: input.observation,
        }),
        ...this.productivity.analyze({
          productivityRecords: input.productivityRecords,
          opportunities: input.opportunities,
        }),
      );
    }

    const filtered = input.config.deduplicateRecommendations
      ? this.deduplicate(candidates)
      : candidates;

    for (const c of filtered) {
      appendEvolutionLog({
        event: "workflow_analysis",
        level: "info",
        details: `${c.evolutionCategory}: ${c.workflowFrictionSummary.slice(0, 80)}`,
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
      const sig = `${c.evolutionCategory}:${c.workflowFrictionSummary.slice(0, 120)}`;
      if (this.seenSignatures.has(sig)) continue;
      this.seenSignatures.add(sig);
      unique.push(c);
    }
    return unique;
  }
}
