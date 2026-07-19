/** R2-08 — Supplier Performance Analyzer. */

import type { PerformanceFinding, SupplierRankingRecord } from "./types.js";
import type { SupplierRankingEngineConfiguration } from "./configuration.js";

export class SupplierPerformanceAnalyzer {
  analyzePerformance(input: {
    previousRankings: SupplierRankingRecord[];
    currentRankings: SupplierRankingRecord[];
    config: SupplierRankingEngineConfiguration;
  }): PerformanceFinding[] {
    const findings: PerformanceFinding[] = [];
    const prevMap = new Map(
      input.previousRankings.map((r) => [r.supplierId, r]),
    );

    for (const current of input.currentRankings) {
      const previous = prevMap.get(current.supplierId);
      const prevScore = previous?.overallSupplierScore ?? null;
      const currScore = current.overallSupplierScore;
      const delta = prevScore !== null ? currScore - prevScore : 0;

      let findingType: PerformanceFinding["findingType"];
      let details: string;

      if (prevScore === null) {
        findingType = "stable";
        details = "Initial supplier ranking recorded";
      } else if (currScore >= input.config.highPerformerThreshold) {
        findingType = "high_performing";
        details = `High-performing supplier: overall score ${currScore}`;
      } else if (delta <= -input.config.decliningPerformanceThreshold) {
        findingType = "declining";
        details = `Declining performance: score dropped ${Math.abs(delta)} points`;
      } else {
        findingType = "stable";
        details = `Stable performance: score ${currScore}`;
      }

      findings.push({
        findingId: `sre-finding-${current.supplierId}-${Date.now()}`,
        findingType,
        supplierId: current.supplierId,
        rankingRecordId: current.rankingRecordId,
        previousOverallScore: prevScore,
        currentOverallScore: currScore,
        scoreDelta: delta,
        details,
      });
    }

    return findings;
  }
}
