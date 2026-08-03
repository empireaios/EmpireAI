/** X2-07 — Financial risk analyzer. */

import { PRE_METADATA_VERSION } from "./paths.js";
import { RiskScoringEngine } from "./risk-scoring-engine.js";
import type { PortfolioRiskRecord } from "./types.js";

export class FinancialRiskAnalyzer {
  private readonly scoring = new RiskScoringEngine();

  analyze(input: {
    companyReference: string | null;
    availablePoolUnits: number;
    highRiskCapitalSignals: number;
    averagePerformanceScore: number;
    allocationCount: number;
  }): PortfolioRiskRecord[] {
    const records: PortfolioRiskRecord[] = [];
    const now = new Date().toISOString();

    if (input.availablePoolUnits <= 0) {
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(85, 90);
      records.push({
        riskRecordId: `pre-${Date.now()}-fin-pool`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "financial",
        riskSeverity,
        riskProbability: 85,
        riskImpact: 90,
        riskScore,
        recommendedMitigation: "Increase structural capital pool capacity before new allocations",
        emerging: input.availablePoolUnits === 0,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (input.highRiskCapitalSignals > 0) {
      const probability = Math.min(95, 50 + input.highRiskCapitalSignals * 15);
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(probability, 75);
      records.push({
        riskRecordId: `pre-${Date.now()}-fin-cap`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "financial",
        riskSeverity,
        riskProbability: probability,
        riskImpact: 75,
        riskScore,
        recommendedMitigation: "Review high-risk capital allocations and rebalance exposure",
        emerging: input.highRiskCapitalSignals >= 2,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (input.averagePerformanceScore > 0 && input.averagePerformanceScore < 50) {
      const probability = 100 - input.averagePerformanceScore;
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(probability, 70);
      records.push({
        riskRecordId: `pre-${Date.now()}-fin-perf`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "financial",
        riskSeverity,
        riskProbability: probability,
        riskImpact: 70,
        riskScore,
        recommendedMitigation: "Stabilize underperforming companies before expanding capital",
        emerging: input.averagePerformanceScore < 40,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (records.length === 0 && input.allocationCount >= 0) {
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(20, 25);
      records.push({
        riskRecordId: `pre-${Date.now()}-fin-ok`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "financial",
        riskSeverity,
        riskProbability: 20,
        riskImpact: 25,
        riskScore,
        recommendedMitigation: "Continue scheduled financial risk monitoring",
        emerging: false,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    return records;
  }
}
