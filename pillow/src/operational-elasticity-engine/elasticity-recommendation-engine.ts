/** X3-11 — Elasticity Recommendation Engine. */

import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import type { ElasticityRecommendation, ElasticityRecord } from "./types.js";

export class ElasticityRecommendationEngine {
  generate(
    records: ElasticityRecord[],
    config: OperationalElasticityEngineConfiguration,
  ): ElasticityRecommendation[] {
    // Never exceed validated operational limits — only recommend when structural evidence clears thresholds.
    const eligible = records.filter(
      (r) =>
        r.currentUtilization >= config.overcapacityThreshold ||
        r.currentUtilization <= config.undercapacityThreshold ||
        Math.abs(r.scalingAdjustment) >= 5,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `oee-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          operationalComponent: records[0]?.operationalComponent ?? "component-default",
          recommendationSummary:
            "Hold elasticity actions — validated structural evidence does not clear utilization thresholds (never exceed validated operational limits)",
          currentUtilization: records[0]?.currentUtilization ?? 0,
          targetUtilization: records[0]?.targetUtilization ?? config.targetUtilizationDefault,
          scalingAdjustment: 0,
          structuralSignalOnly: true,
          neverExceedValidatedOperationalLimits: true,
        },
      ];
    }

    return eligible.slice(0, 8).map((record, index) => {
      const direction =
        record.scalingAdjustment > 0
          ? "expand"
          : record.scalingAdjustment < 0
            ? "contract"
            : "hold";
      const summary = `${direction} capacity on ${record.operationalComponent} cautiously — util ${record.currentUtilization}%, target ${record.targetUtilization}%, adj ${record.scalingAdjustment}`;
      return {
        recommendationId: `oee-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        operationalComponent: record.operationalComponent,
        recommendationSummary: summary,
        currentUtilization: record.currentUtilization,
        targetUtilization: record.targetUtilization,
        scalingAdjustment: record.scalingAdjustment,
        structuralSignalOnly: true,
        neverExceedValidatedOperationalLimits: true,
      };
    });
  }
}
