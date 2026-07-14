/** T5-08 — Workspace recommendation prioritization and ranking. */

import { appendWorkspaceLog } from "./ewi-logging.js";
import type { ExecutiveWorkspaceIntelligenceConfiguration } from "./configuration.js";
import type {
  RawWorkspaceCandidate,
  WorkspaceIntelligenceRecord,
  WorkspacePriority,
} from "./types.js";

export class WorkspacePrioritizationEngine {
  prioritize(
    candidates: RawWorkspaceCandidate[],
    config: ExecutiveWorkspaceIntelligenceConfiguration,
  ): Array<RawWorkspaceCandidate & { workspacePriority: WorkspacePriority }> {
    if (!config.dashboardRecommendationRulesEnabled && !config.workspaceOrganizationRulesEnabled) {
      return candidates.map((c) => ({ ...c, workspacePriority: "medium" as WorkspacePriority }));
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
      const workspacePriority = this.scoreToPriority(score);
      appendWorkspaceLog({
        event: "priority_calculation",
        level: "info",
        details: `${candidate.workspaceCategory} · ${workspacePriority}`,
      });
      return { ...candidate, workspacePriority };
    });
  }

  rankRecommendations(records: WorkspaceIntelligenceRecord[]): WorkspaceIntelligenceRecord[] {
    const rank: Record<WorkspacePriority, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      deferred: 1,
    };
    return [...records].sort(
      (a, b) =>
        rank[b.workspacePriority] - rank[a.workspacePriority] ||
        b.confidenceScore - a.confidenceScore,
    );
  }

  scoreToPriority(score: number): WorkspacePriority {
    if (score >= 0.85) return "critical";
    if (score >= 0.7) return "high";
    if (score >= 0.5) return "medium";
    if (score >= 0.3) return "low";
    return "deferred";
  }
}
