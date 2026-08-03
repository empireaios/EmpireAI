/** X3-10 — Constraint Analysis Engine. */

import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type { BottleneckRecord } from "./types.js";

export class ConstraintAnalysisEngine {
  analyze(
    records: BottleneckRecord[],
    config: BottleneckIntelligenceConfiguration,
  ): BottleneckRecord[] {
    return records
      .filter(
        (r) =>
          r.severityScore >= config.severityThreshold ||
          r.businessImpactScore >= config.impactThreshold ||
          (r.bottleneckCategory === "throughput" &&
            r.severityScore >= config.throughputConstraintThreshold),
      )
      .map((r) => ({
        ...r,
        recommendationSummary: `Constraint analysis · ${r.bottleneckCategory} · ${r.affectedComponent} · severity ${r.severityScore} · impact ${r.businessImpactScore}`,
        timestamp: new Date().toISOString(),
      }));
  }
}
