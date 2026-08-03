import { PRIORITY_RANK } from "./paths.js";
import type { PriorityLevel, RecommendationPackage } from "./types.js";

/** Ranks recommendation packages by priority, strategic value, and confidence. */
export class RecommendationRanker {
  rank(packages: RecommendationPackage[]): RecommendationPackage[] {
    const ranked = packages.map((pkg) => {
      const priorityWeight = PRIORITY_RANK[pkg.priority as PriorityLevel] ?? 50;
      const rankScore =
        Math.round((priorityWeight * 0.5 + pkg.strategicValue * 0.3 + pkg.confidenceScore * 0.2) * 10) / 10;
      return { ...pkg, rankScore };
    });

    return ranked.sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (b.strategicValue !== a.strategicValue) return b.strategicValue - a.strategicValue;
      return b.confidenceScore - a.confidenceScore;
    });
  }
}
