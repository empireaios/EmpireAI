/** X2-08 — Portfolio balance validator. */

import { PBE_METADATA_VERSION } from "./paths.js";
import type { PortfolioBalanceEngineConfiguration } from "./configuration.js";
import type {
  BalanceValidationReport,
  MeasureDiversificationInput,
  PortfolioBalanceRecord,
} from "./types.js";

export class PortfolioBalanceValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): BalanceValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `pbe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PBE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: PortfolioBalanceEngineConfiguration,
  ): BalanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Portfolio Balance Engine disabled");
    if (!config.neverAutoRebalanceBeyondApprovalPolicy) {
      errors.push("Automatic rebalancing beyond approval policy is forbidden");
    }
    if (!config.preserveOptimizationTraceability) {
      errors.push("Optimization traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateMeasure(
    input: MeasureDiversificationInput,
    config: PortfolioBalanceEngineConfiguration,
  ): BalanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Diversification measurement requires validated=true");
    }
    if (
      input.portfolioReference &&
      /(token|secret|password|credential)/i.test(input.portfolioReference)
    ) {
      errors.push("Portfolio reference must not contain credentials");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateBalanceRecord(record: PortfolioBalanceRecord): BalanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.portfolioBalanceId.startsWith("pbe-")) {
      errors.push("Invalid portfolio balance ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.autoRebalanceApplied) {
      errors.push("Automatic rebalancing must remain disabled");
    }
    if (record.diversificationScore < 0 || record.diversificationScore > 100) {
      warnings.push("Diversification score outside expected band");
    }
    return this.report(started, errors, warnings);
  }
}
