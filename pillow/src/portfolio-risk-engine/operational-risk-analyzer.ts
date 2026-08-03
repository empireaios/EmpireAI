/** X2-07 — Operational risk analyzer. */

import { PRE_METADATA_VERSION } from "./paths.js";
import { RiskScoringEngine } from "./risk-scoring-engine.js";
import type { PortfolioRiskRecord } from "./types.js";

export class OperationalRiskAnalyzer {
  private readonly scoring = new RiskScoringEngine();

  analyze(input: {
    companyReference: string | null;
    activeCompanies: number;
    pendingCompanies: number;
    knowledgeAssets: number;
    sharedKnowledge: number;
    frameworkHealthScore: number;
  }): PortfolioRiskRecord[] {
    const records: PortfolioRiskRecord[] = [];
    const now = new Date().toISOString();

    if (input.activeCompanies === 0) {
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(70, 80);
      records.push({
        riskRecordId: `pre-${Date.now()}-ops-empty`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "operational",
        riskSeverity,
        riskProbability: 70,
        riskImpact: 80,
        riskScore,
        recommendedMitigation: "Register and activate companies to reduce portfolio operational blind spots",
        emerging: true,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (input.pendingCompanies > 0) {
      const probability = Math.min(80, 30 + input.pendingCompanies * 10);
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(probability, 55);
      records.push({
        riskRecordId: `pre-${Date.now()}-ops-pending`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "operational",
        riskSeverity,
        riskProbability: probability,
        riskImpact: 55,
        riskScore,
        recommendedMitigation: "Advance pending company lifecycle states to active operations",
        emerging: input.pendingCompanies >= 3,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (input.knowledgeAssets > 0 && input.sharedKnowledge === 0) {
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(55, 50);
      records.push({
        riskRecordId: `pre-${Date.now()}-ops-know`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "operational",
        riskSeverity,
        riskProbability: 55,
        riskImpact: 50,
        riskScore,
        recommendedMitigation: "Share reusable knowledge across companies to reduce operational isolation",
        emerging: true,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (input.frameworkHealthScore > 0 && input.frameworkHealthScore < 55) {
      const probability = 100 - input.frameworkHealthScore;
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(probability, 65);
      records.push({
        riskRecordId: `pre-${Date.now()}-ops-fw`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "operational",
        riskSeverity,
        riskProbability: probability,
        riskImpact: 65,
        riskScore,
        recommendedMitigation: "Restore enterprise portfolio framework health before scaling operations",
        emerging: input.frameworkHealthScore < 40,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (records.length === 0) {
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(18, 22);
      records.push({
        riskRecordId: `pre-${Date.now()}-ops-ok`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "operational",
        riskSeverity,
        riskProbability: 18,
        riskImpact: 22,
        riskScore,
        recommendedMitigation: "Continue scheduled operational risk monitoring",
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
