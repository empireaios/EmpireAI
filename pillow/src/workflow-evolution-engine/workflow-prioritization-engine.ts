/** T5-05 — Workflow prioritization and ranking. */

import { appendEvolutionLog } from "./workflow-logging.js";
import type { WorkflowEvolutionConfiguration } from "./configuration.js";
import type {
  EvolutionPriority,
  RawEvolutionCandidate,
  WorkflowEvolutionRecord,
} from "./types.js";

export class WorkflowPrioritizationEngine {
  prioritize(
    candidates: RawEvolutionCandidate[],
    config: WorkflowEvolutionConfiguration,
  ): Array<RawEvolutionCandidate & { priority: EvolutionPriority }> {
    if (!config.prioritizationRulesEnabled) {
      return candidates.map((c) => ({ ...c, priority: "medium" as EvolutionPriority }));
    }

    const scored = candidates.map((candidate) => {
      let score = candidate.impactScore;
      if (config.productivityScoringRulesEnabled) {
        score = candidate.impactScore * 0.65 + candidate.confidenceScore * 0.35;
      }
      return { candidate, score: Math.max(0, Math.min(1, score)) };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.map(({ candidate, score }) => {
      const priority = this.scoreToPriority(score);
      appendEvolutionLog({
        event: "workflow_prioritization",
        level: "info",
        details: `${candidate.evolutionCategory} · score ${score.toFixed(2)} · ${priority}`,
      });
      return { ...candidate, priority };
    });
  }

  rankRecommendations(records: WorkflowEvolutionRecord[]): WorkflowEvolutionRecord[] {
    const rank: Record<EvolutionPriority, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      deferred: 1,
    };
    return [...records].sort(
      (a, b) =>
        rank[b.priority] - rank[a.priority] || b.confidenceScore - a.confidenceScore,
    );
  }

  scoreToPriority(score: number): EvolutionPriority {
    if (score >= 0.85) return "critical";
    if (score >= 0.7) return "high";
    if (score >= 0.5) return "medium";
    if (score >= 0.3) return "low";
    return "deferred";
  }
}
