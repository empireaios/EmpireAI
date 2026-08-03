/** X2-07 — Portfolio risk validator. */

import { PRE_METADATA_VERSION } from "./paths.js";
import type { PortfolioRiskEngineConfiguration } from "./configuration.js";
import type {
  MonitorRisksInput,
  PortfolioRiskRecord,
  RiskValidationReport,
} from "./types.js";

export class RiskValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): RiskValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `pre-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PRE_METADATA_VERSION,
    };
  }

  validateConfiguration(config: PortfolioRiskEngineConfiguration): RiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Portfolio Risk Engine disabled");
    if (!config.neverSuppressCriticalRisks) {
      errors.push("Critical enterprise risks must never be suppressed");
    }
    if (!config.preserveRiskTraceability) {
      errors.push("Risk traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateMonitor(
    input: MonitorRisksInput,
    config: PortfolioRiskEngineConfiguration,
  ): RiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) errors.push("Risk monitoring requires validated=true");
    if (input.companyReference && /(token|secret|password|credential)/i.test(input.companyReference)) {
      errors.push("Company reference must not contain credentials");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateRiskRecord(record: PortfolioRiskRecord): RiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.riskRecordId.startsWith("pre-")) errors.push("Invalid risk record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.suppressedCritical) errors.push("Critical risks must not be suppressed");
    if (record.riskProbability < 0 || record.riskProbability > 100) {
      errors.push("Risk probability out of range");
    }
    if (record.riskImpact < 0 || record.riskImpact > 100) {
      errors.push("Risk impact out of range");
    }
    if (record.riskScore < 0 || record.riskScore > 100) {
      warnings.push("Risk score outside expected band");
    }
    return this.report(started, errors, warnings);
  }
}
