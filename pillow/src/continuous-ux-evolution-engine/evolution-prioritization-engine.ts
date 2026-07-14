/** T5-07 — Evolution prioritization and ranking. */

import { appendEvolutionLog } from "./cue-logging.js";
import type { ContinuousUxEvolutionConfiguration } from "./configuration.js";
import type {
  ImprovementPriority,
  RawEvolutionCandidate,
  UxEvolutionRecord,
} from "./types.js";

export class EvolutionPrioritizationEngine {
  prioritize(
    candidates: RawEvolutionCandidate[],
    config: ContinuousUxEvolutionConfiguration,
  ): Array<RawEvolutionCandidate & { improvementPriority: ImprovementPriority }> {
    if (!config.improvementPrioritizationRulesEnabled) {
      return candidates.map((c) => ({ ...c, improvementPriority: "medium" as ImprovementPriority }));
    }

    const scored = candidates.map((candidate) => {
      const score = Math.max(
        0,
        Math.min(1, candidate.impactScore * 0.65 + candidate.confidenceScore * 0.35),
      );
      return { candidate, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.map(({ candidate, score }) => {
      const improvementPriority = this.scoreToPriority(score);
      appendEvolutionLog({
        event: "priority_calculation",
        level: "info",
        details: `${candidate.evolutionCategory} · ${improvementPriority}`,
      });
      return { ...candidate, improvementPriority };
    });
  }

  rankImprovements(records: UxEvolutionRecord[]): UxEvolutionRecord[] {
    const rank: Record<ImprovementPriority, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      deferred: 1,
    };
    return [...records].sort(
      (a, b) =>
        rank[b.improvementPriority] - rank[a.improvementPriority] ||
        b.confidenceScore - a.confidenceScore,
    );
  }

  scoreToPriority(score: number): ImprovementPriority {
    if (score >= 0.85) return "critical";
    if (score >= 0.7) return "high";
    if (score >= 0.5) return "medium";
    if (score >= 0.3) return "low";
    return "deferred";
  }
}
