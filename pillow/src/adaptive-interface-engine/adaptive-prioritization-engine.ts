/** T5-06 — Adaptation prioritization and ranking. */

import { appendAdaptiveLog } from "./adaptive-logging.js";
import type { AdaptiveInterfaceConfiguration } from "./configuration.js";
import type {
  AdaptationPriority,
  AdaptiveInterfaceRecord,
  RawAdaptationCandidate,
} from "./types.js";

export class AdaptivePrioritizationEngine {
  prioritize(
    candidates: RawAdaptationCandidate[],
    config: AdaptiveInterfaceConfiguration,
  ): Array<RawAdaptationCandidate & { priority: AdaptationPriority }> {
    if (!config.personalizationRulesEnabled) {
      return candidates.map((c) => ({ ...c, priority: "medium" as AdaptationPriority }));
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
      const priority = this.scoreToPriority(score);
      appendAdaptiveLog({
        event: "adaptation_prioritization",
        level: "info",
        details: `${candidate.adaptationCategory} · ${priority}`,
      });
      return { ...candidate, priority };
    });
  }

  rankAdaptations(records: AdaptiveInterfaceRecord[]): AdaptiveInterfaceRecord[] {
    const rank: Record<AdaptationPriority, number> = {
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

  scoreToPriority(score: number): AdaptationPriority {
    if (score >= 0.85) return "critical";
    if (score >= 0.7) return "high";
    if (score >= 0.5) return "medium";
    if (score >= 0.3) return "low";
    return "deferred";
  }
}
