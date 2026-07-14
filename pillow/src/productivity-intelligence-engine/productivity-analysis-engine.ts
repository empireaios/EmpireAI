/** T5-04 — Productivity Analysis Engine — aggregates all pattern analyzers. */

import { appendProductivityLog } from "./productivity-logging.js";
import { BottleneckDetectionEngine } from "./bottleneck-detection-engine.js";
import { NavigationPatternAnalyzer } from "./navigation-pattern-analyzer.js";
import { ProductivityTrendEngine } from "./productivity-trend-engine.js";
import { RepetitionAnalyzer } from "./repetition-analyzer.js";
import { TaskSequenceAnalyzer } from "./task-sequence-analyzer.js";
import { WorkflowPatternAnalyzer } from "./workflow-pattern-analyzer.js";
import type { ProductivityIntelligenceConfiguration } from "./configuration.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type {
  ProductivityIntelligenceEngineBundle,
  RawProductivityCandidate,
} from "./types.js";

export class ProductivityAnalysisEngine {
  private readonly workflow = new WorkflowPatternAnalyzer();
  private readonly navigation = new NavigationPatternAnalyzer();
  private readonly taskSequence = new TaskSequenceAnalyzer();
  private readonly bottleneck = new BottleneckDetectionEngine();
  private readonly repetition = new RepetitionAnalyzer();
  private readonly trend = new ProductivityTrendEngine();
  private readonly seenSignatures = new Set<string>();

  analyze(input: {
    engines: ProductivityIntelligenceEngineBundle;
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
    observation: ObservationRecord | null;
    config: ProductivityIntelligenceConfiguration;
  }): RawProductivityCandidate[] {
    const candidates: RawProductivityCandidate[] = [];

    if (input.config.patternDetectionRulesEnabled) {
      candidates.push(
        ...this.workflow.analyze({
          engines: input.engines,
          opportunities: input.opportunities,
          audit: input.audit,
          observation: input.observation,
        }),
        ...this.navigation.analyze({
          engines: input.engines,
          opportunities: input.opportunities,
          observation: input.observation,
        }),
        ...this.taskSequence.analyze({
          engines: input.engines,
          observation: input.observation,
        }),
        ...this.repetition.analyze({
          engines: input.engines,
          observation: input.observation,
        }),
      );
    }

    if (input.config.bottleneckDetectionRulesEnabled) {
      candidates.push(
        ...this.bottleneck.analyze({
          engines: input.engines,
          opportunities: input.opportunities,
          audit: input.audit,
        }),
      );
    }

    if (input.config.trendAnalysisRulesEnabled) {
      candidates.push(
        ...this.trend.analyze({
          engines: input.engines,
          opportunities: input.opportunities,
          observation: input.observation,
        }),
      );
    }

    const filtered = input.config.deduplicatePatterns
      ? this.deduplicate(candidates)
      : candidates;

    for (const c of filtered) {
      appendProductivityLog({
        event: "workflow_pattern_detection",
        level: "info",
        details: `${c.productivityObservations.join(",")}: ${c.workflowPatternSummary.slice(0, 80)}`,
      });
    }

    return filtered;
  }

  resetForTesting(): void {
    this.seenSignatures.clear();
  }

  private deduplicate(candidates: RawProductivityCandidate[]): RawProductivityCandidate[] {
    const unique: RawProductivityCandidate[] = [];
    for (const c of candidates) {
      const sig = `${c.productivityObservations.join(",")}:${c.workflowPatternSummary.slice(0, 120)}`;
      if (this.seenSignatures.has(sig)) continue;
      this.seenSignatures.add(sig);
      unique.push(c);
    }
    return unique;
  }
}
