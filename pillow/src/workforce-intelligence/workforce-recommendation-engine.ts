/** X3-08 — Workforce Recommendation Engine. */

import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceRecommendation, WorkforceRecord } from "./types.js";

export class WorkforceRecommendationEngine {
  generate(
    records: WorkforceRecord[],
    config: WorkforceIntelligenceConfiguration,
  ): WorkforceRecommendation[] {
    // NEVER recommend overload beyond validated limits / scores clearing thresholds.
    const eligible = records.filter(
      (r) =>
        r.agentUtilization >= config.minAgentUtilization &&
        r.agentUtilization <= 95 &&
        r.throughputMetrics >= config.minThroughputMetrics &&
        r.workforceEfficiencyScore >= config.minWorkforceEfficiencyScore &&
        r.workloadDistribution >= config.minWorkloadDistribution,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `wfi-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          workforceReference: records[0]?.workforceReference ?? "workforce-default",
          recommendationSummary:
            "Hold workforce optimization — validated readiness does not clear utilization/distribution/throughput/efficiency thresholds (never overload beyond validated limits)",
          agentUtilization: records[0]?.agentUtilization ?? 0,
          workloadDistribution: records[0]?.workloadDistribution ?? 0,
          throughputMetrics: records[0]?.throughputMetrics ?? 0,
          workforceEfficiencyScore: records[0]?.workforceEfficiencyScore ?? 0,
          structuralSignalOnly: true,
          neverOverloadWorkforceBeyondValidatedLimits: true,
        },
      ];
    }

    return eligible.slice(0, 6).map((record, index) => {
      const summary = `Optimize ${record.workforceReference} cautiously — utilization ${record.agentUtilization}, throughput ${record.throughputMetrics}, efficiency ${record.workforceEfficiencyScore}`;
      return {
        recommendationId: `wfi-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        workforceReference: record.workforceReference,
        recommendationSummary: summary,
        agentUtilization: record.agentUtilization,
        workloadDistribution: record.workloadDistribution,
        throughputMetrics: record.throughputMetrics,
        workforceEfficiencyScore: record.workforceEfficiencyScore,
        structuralSignalOnly: true,
        neverOverloadWorkforceBeyondValidatedLimits: true,
      };
    });
  }
}
