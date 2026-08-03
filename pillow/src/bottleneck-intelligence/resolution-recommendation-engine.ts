/** X3-10 — Resolution Recommendation Engine. */

import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type { BottleneckRecommendation, BottleneckRecord } from "./types.js";

export class ResolutionRecommendationEngine {
  generate(
    records: BottleneckRecord[],
    config: BottleneckIntelligenceConfiguration,
  ): BottleneckRecommendation[] {
    // Never generate unsupported conclusions — only recommend when structural evidence clears thresholds.
    const eligible = records.filter(
      (r) =>
        r.severityScore >= config.severityThreshold ||
        r.businessImpactScore >= config.impactThreshold,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `bni-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          bottleneckCategory: records[0]?.bottleneckCategory ?? "operational",
          affectedComponent: records[0]?.affectedComponent ?? "component-default",
          recommendationSummary:
            "Hold bottleneck resolutions — validated structural evidence does not clear severity/impact thresholds (never generate unsupported bottleneck conclusions)",
          severityScore: records[0]?.severityScore ?? 0,
          businessImpactScore: records[0]?.businessImpactScore ?? 0,
          resolutionPriority: records[0]?.resolutionPriority ?? 0,
          structuralSignalOnly: true,
          neverGenerateUnsupportedBottleneckConclusions: true,
        },
      ];
    }

    return eligible.slice(0, 8).map((record, index) => {
      const summary = `Resolve ${record.bottleneckCategory} bottleneck on ${record.affectedComponent} cautiously — severity ${record.severityScore}, impact ${record.businessImpactScore}, priority ${record.resolutionPriority}`;
      return {
        recommendationId: `bni-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        bottleneckCategory: record.bottleneckCategory,
        affectedComponent: record.affectedComponent,
        recommendationSummary: summary,
        severityScore: record.severityScore,
        businessImpactScore: record.businessImpactScore,
        resolutionPriority: record.resolutionPriority,
        structuralSignalOnly: true,
        neverGenerateUnsupportedBottleneckConclusions: true,
      };
    });
  }
}
