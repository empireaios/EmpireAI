/** R2-18 — SLA Risk Analyzer. */

import type { ComplianceStatus } from "./types.js";
import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";

export class SlaRiskAnalyzer {
  detectSlaRisk(
    complianceStatus: ComplianceStatus,
    complianceScore: number,
    config: FulfilmentSlaMonitorConfiguration,
  ): boolean {
    return (
      complianceStatus === "at_risk" ||
      (complianceScore < config.riskThresholdScore && complianceScore >= config.breachThresholdScore)
    );
  }

  detectSlaBreach(complianceStatus: ComplianceStatus): boolean {
    return complianceStatus === "breached";
  }
}
