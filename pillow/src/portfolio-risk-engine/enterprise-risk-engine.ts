/** X2-07 — Enterprise risk engine. */

import { appendPreLog } from "./pre-logging.js";
import { PRE_METADATA_VERSION } from "./paths.js";
import { RiskScoringEngine } from "./risk-scoring-engine.js";
import type { PortfolioRiskRecord } from "./types.js";

export class EnterpriseRiskEngine {
  private readonly scoring = new RiskScoringEngine();

  monitor(input: {
    companyReference: string | null;
    registeredModules: number;
    activeModules: number;
    companyCount: number;
    dashboardHealthScore: number;
    supplierConcentrationHint: number;
    customerConcentrationHint: number;
  }): PortfolioRiskRecord[] {
    const records: PortfolioRiskRecord[] = [];
    const now = new Date().toISOString();

    if (input.activeModules < input.registeredModules) {
      const inactive = input.registeredModules - input.activeModules;
      const probability = Math.min(90, 40 + inactive * 10);
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(probability, 60);
      records.push({
        riskRecordId: `pre-${Date.now()}-ent-mod`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "enterprise",
        riskSeverity,
        riskProbability: probability,
        riskImpact: 60,
        riskScore,
        recommendedMitigation: "Activate suspended portfolio modules to restore enterprise coverage",
        emerging: inactive >= 2,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (input.companyCount > 0) {
      const companyProb = input.dashboardHealthScore > 0 && input.dashboardHealthScore < 50
        ? 100 - input.dashboardHealthScore
        : 25;
      const companyImpact = 55;
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(companyProb, companyImpact);
      records.push({
        riskRecordId: `pre-${Date.now()}-co`,
        timestamp: now,
        companyReference: input.companyReference ?? "portfolio",
        riskCategory: "company",
        riskSeverity,
        riskProbability: companyProb,
        riskImpact: companyImpact,
        riskScore,
        recommendedMitigation: "Review company health signals from executive portfolio dashboard",
        emerging: companyProb >= 55,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (input.supplierConcentrationHint >= 60) {
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(
        input.supplierConcentrationHint,
        70,
      );
      records.push({
        riskRecordId: `pre-${Date.now()}-sup`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "supplier_concentration",
        riskSeverity,
        riskProbability: input.supplierConcentrationHint,
        riskImpact: 70,
        riskScore,
        recommendedMitigation: "Diversify supplier exposure to reduce concentration risk",
        emerging: input.supplierConcentrationHint >= 75,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    if (input.customerConcentrationHint >= 60) {
      const { riskScore, riskSeverity } = this.scoring.scoreRecord(
        input.customerConcentrationHint,
        65,
      );
      records.push({
        riskRecordId: `pre-${Date.now()}-cust`,
        timestamp: now,
        companyReference: input.companyReference,
        riskCategory: "customer_concentration",
        riskSeverity,
        riskProbability: input.customerConcentrationHint,
        riskImpact: 65,
        riskScore,
        recommendedMitigation: "Expand customer base to reduce concentration dependency",
        emerging: input.customerConcentrationHint >= 75,
        structuralSignalOnly: true,
        suppressedCritical: false,
        validationStatus: "passed",
        metadataVersion: PRE_METADATA_VERSION,
      });
    }

    appendPreLog({
      event: "risk_monitoring",
      level: "info",
      details: `Enterprise risk monitor produced ${records.length} record(s)`,
    });

    return records;
  }
}
