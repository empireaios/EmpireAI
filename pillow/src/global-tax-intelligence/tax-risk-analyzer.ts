/** X4-07 — Tax Risk Analyzer. */

import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import {
  buildTaxIntelligenceRecord,
  computeStructuralTaxSignals,
} from "./structural-signals.js";
import type { TaxAnalysisInput, TaxIntelligenceRecord } from "./types.js";

export class TaxRiskAnalyzer {
  detectComplianceRisks(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    const signals = computeStructuralTaxSignals(
      {
        ...input,
        taxCategory: "compliance_risk",
        riskHint: input.riskHint ?? Math.max(config.riskThreshold + 10, 70),
      },
      config,
    );
    return buildTaxIntelligenceRecord(
      {
        ...signals,
        recommendationSummary: `Compliance risk ${signals.riskLevel} for ${signals.country} — not legal advice`,
      },
      signals.riskScore >= config.riskThreshold ? "partial" : "passed",
    );
  }

  detectOptimizationOpportunities(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    const signals = computeStructuralTaxSignals(
      {
        ...input,
        taxCategory: "optimization",
        optimizationHint: input.optimizationHint ?? true,
      },
      config,
    );
    return buildTaxIntelligenceRecord(
      {
        ...signals,
        optimizationOpportunity: true,
        recommendationSummary: `Optimization opportunity signal for ${signals.country} — structural only; not legal advice`,
      },
      "partial",
    );
  }

  highRiskCount(records: TaxIntelligenceRecord[]): number {
    return records.filter((r) => r.riskLevel === "critical" || r.riskLevel === "high").length;
  }

  optimizationCount(records: TaxIntelligenceRecord[]): number {
    return records.filter((r) => r.optimizationOpportunity).length;
  }
}
