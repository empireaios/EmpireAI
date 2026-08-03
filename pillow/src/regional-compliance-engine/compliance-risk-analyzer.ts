/** X4-06 — Compliance Risk Analyzer. */

import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import {
  buildComplianceRecord,
  computeStructuralComplianceSignals,
} from "./structural-signals.js";
import type { ComplianceAnalysisInput, ComplianceRecord } from "./types.js";

export class ComplianceRiskAnalyzer {
  assessRisks(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): ComplianceRecord {
    const signals = computeStructuralComplianceSignals(input, config);
    return buildComplianceRecord(
      {
        ...signals,
        requiredActions: [
          ...signals.requiredActions,
          `Risk posture ${signals.riskLevel} (score=${signals.riskScore}) for ${signals.country}`,
        ],
      },
      signals.riskScore >= config.riskThreshold ? "partial" : "passed",
    );
  }

  detectViolations(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): ComplianceRecord {
    const signals = computeStructuralComplianceSignals(
      { ...input, violationHint: input.violationHint ?? true },
      config,
    );
    return buildComplianceRecord(
      {
        ...signals,
        violationDetected: true,
        complianceStatus: signals.complianceStatus === "unknown" ? "unknown" : "gap",
        requiredActions: [
          `Violation signal for ${signals.country}/${signals.regulationCategory}`,
          ...signals.requiredActions,
        ],
      },
      "partial",
    );
  }

  filterViolations(records: ComplianceRecord[]): ComplianceRecord[] {
    return records.filter((r) => r.violationDetected || r.complianceStatus === "gap");
  }

  highRiskCount(records: ComplianceRecord[]): number {
    return records.filter(
      (r) => r.riskLevel === "critical" || r.riskLevel === "high",
    ).length;
  }
}
