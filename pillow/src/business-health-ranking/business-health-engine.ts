/** X2-09 — Business Health Engine. */

import type { PortfolioPerformanceRecord } from "../portfolio-performance-engine/types.js";
import type { PortfolioRiskRecord } from "../portfolio-risk-engine/types.js";
import type { BusinessHealthRankingConfiguration } from "./configuration.js";
import { HealthScoringEngine } from "./health-scoring-engine.js";
import { BHR_METADATA_VERSION } from "./paths.js";
import type { BusinessHealthRecord, ManagementPriority } from "./types.js";

function latestPerf(
  records: PortfolioPerformanceRecord[],
  companyReference: string,
): PortfolioPerformanceRecord | null {
  const matches = records.filter((r) => r.companyReference === companyReference);
  if (matches.length === 0) return null;
  return matches[matches.length - 1]!;
}

function maxRisk(
  records: PortfolioRiskRecord[],
  companyReference: string,
): number {
  const matches = records.filter((r) => r.companyReference === companyReference);
  if (matches.length === 0) return 50;
  return Math.max(...matches.map((r) => r.riskScore));
}

function priorityFor(
  composite: number,
  declining: boolean,
  highPerforming: boolean,
  config: BusinessHealthRankingConfiguration,
): ManagementPriority {
  if (!config.priorityThresholdsEnabled) return "monitor";
  if (composite < config.criticalPriorityThreshold) return "critical_attention";
  if (declining || composite < config.highPriorityThreshold) return "high_attention";
  if (highPerforming) return "scale";
  if (composite >= config.highPerformerThreshold - 5) return "maintain";
  return "monitor";
}

export class BusinessHealthEngine {
  private readonly scoring = new HealthScoringEngine();

  measure(input: {
    companyReferences: string[];
    performanceRecords: PortfolioPerformanceRecord[];
    riskRecords: PortfolioRiskRecord[];
    config: BusinessHealthRankingConfiguration;
  }): BusinessHealthRecord[] {
    const now = new Date().toISOString();
    const out: BusinessHealthRecord[] = [];

    for (let i = 0; i < input.companyReferences.length; i++) {
      const companyReference = input.companyReferences[i]!;
      const perf = latestPerf(input.performanceRecords, companyReference);
      const riskScore = maxRisk(input.riskRecords, companyReference);

      const scores = input.config.healthScoringRulesEnabled
        ? this.scoring.scoreCompany({
            revenueIndex: perf?.revenueMetrics.revenueIndex ?? 50,
            profitabilityIndex: perf?.profitabilityMetrics.profitabilityIndex ?? 50,
            operationalEfficiencyIndex:
              perf?.operationalMetrics.operationalEfficiencyIndex ?? 50,
            customerPerformanceIndex:
              perf?.growthMetrics.customerPerformanceIndex ?? 50,
            growthIndex: perf?.growthMetrics.growthIndex ?? 50,
            riskScore,
          })
        : {
            financialHealthScore: 50,
            operationalHealthScore: 50,
            customerHealthScore: 50,
            growthHealthScore: 50,
            operationalRiskScore: riskScore,
            compositeHealthScore: 50,
          };

      const decliningDetected =
        scores.compositeHealthScore < input.config.decliningThreshold;
      const highPerformingDetected =
        scores.compositeHealthScore >= input.config.highPerformerThreshold;

      out.push({
        businessHealthId: `bhr-${Date.now()}-${i}`,
        timestamp: now,
        companyReference,
        financialHealthScore: scores.financialHealthScore,
        operationalHealthScore: scores.operationalHealthScore,
        customerHealthScore: scores.customerHealthScore,
        growthHealthScore: scores.growthHealthScore,
        operationalRiskScore: scores.operationalRiskScore,
        compositeHealthScore: scores.compositeHealthScore,
        overallEnterpriseRanking: 0,
        rankingByFinancial: 0,
        rankingByOperational: 0,
        rankingByGrowth: 0,
        rankingByCustomer: 0,
        rankingByOperationalRisk: 0,
        decliningDetected,
        highPerformingDetected,
        recommendedManagementPriority: priorityFor(
          scores.compositeHealthScore,
          decliningDetected,
          highPerformingDetected,
          input.config,
        ),
        rankingManipulated: false,
        structuralSignalOnly: true,
        validationStatus: perf ? "passed" : "partial",
        metadataVersion: BHR_METADATA_VERSION,
      });
    }

    return out;
  }
}
