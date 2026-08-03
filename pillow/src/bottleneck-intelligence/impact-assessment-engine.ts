/** X3-10 — Impact Assessment Engine (rank by business impact). */

import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type { BottleneckRecord } from "./types.js";

export class ImpactAssessmentEngine {
  rankByImpact(
    records: BottleneckRecord[],
    config: BottleneckIntelligenceConfiguration,
  ): BottleneckRecord[] {
    if (!config.impactRankingEnabled) return [];

    const ranked = [...records]
      .sort((a, b) => {
        const scoreA = a.businessImpactScore * 0.55 + a.severityScore * 0.45;
        const scoreB = b.businessImpactScore * 0.55 + b.severityScore * 0.45;
        return scoreB - scoreA;
      })
      .map((r, index) => ({
        ...r,
        resolutionPriority: index + 1,
        recommendationSummary: `Impact rank #${index + 1} · ${r.bottleneckCategory} · ${r.affectedComponent} · impact ${r.businessImpactScore} · severity ${r.severityScore}`,
        timestamp: new Date().toISOString(),
      }));

    return ranked;
  }
}
