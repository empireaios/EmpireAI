/** T5-03 — UX opportunity prioritization and ranking. */

import { appendDiscoveryLog } from "./opportunity-logging.js";
import type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";
import type {
  OpportunityPriority,
  OpportunityRecord,
  RawOpportunityCandidate,
} from "./types.js";

const SEVERITY_IMPACT: Record<string, number> = {
  critical: 1,
  error: 0.9,
  high: 0.85,
  warning: 0.75,
  medium: 0.6,
  low: 0.35,
  info: 0.2,
};

const COMPLEXITY_PENALTY: Record<string, number> = {
  low: 0,
  medium: 0.1,
  high: 0.2,
  very_high: 0.35,
};

export class UxPrioritizationEngine {
  prioritize(
    candidates: RawOpportunityCandidate[],
    config: UxOpportunityDiscoveryConfiguration,
  ): Array<RawOpportunityCandidate & { priority: OpportunityPriority }> {
    if (!config.prioritizationRulesEnabled) {
      return candidates.map((c) => ({ ...c, priority: "medium" as OpportunityPriority }));
    }

    const scored = candidates.map((candidate) => {
      let score = candidate.impactScore;
      if (config.impactScoringRulesEnabled) {
        score = candidate.impactScore * 0.6 + candidate.confidenceScore * 0.4;
      }
      if (config.complexityScoringRulesEnabled) {
        score -= COMPLEXITY_PENALTY[candidate.complexity] ?? 0.1;
      }
      return { candidate, score: Math.max(0, Math.min(1, score)) };
    });

    scored.sort((a, b) => b.score - a.score);

    const result = scored.map(({ candidate, score }) => {
      const priority = this.scoreToPriority(score);
      appendDiscoveryLog({
        event: "opportunity_prioritization",
        level: "info",
        details: `${candidate.category} · score ${score.toFixed(2)} · ${priority}`,
      });
      return { ...candidate, priority };
    });

    return result;
  }

  rankOpportunities(opportunities: OpportunityRecord[]): OpportunityRecord[] {
    const rank: Record<OpportunityPriority, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      deferred: 1,
    };
    return [...opportunities].sort(
      (a, b) =>
        rank[b.priority] - rank[a.priority] ||
        b.confidenceScore - a.confidenceScore,
    );
  }

  scoreToPriority(score: number): OpportunityPriority {
    if (score >= 0.85) return "critical";
    if (score >= 0.7) return "high";
    if (score >= 0.5) return "medium";
    if (score >= 0.3) return "low";
    return "deferred";
  }
}

export function impactFromSeverity(severity: string): number {
  return SEVERITY_IMPACT[severity] ?? 0.5;
}
