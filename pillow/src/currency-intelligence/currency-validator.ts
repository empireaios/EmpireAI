/** X4-05 — Currency Validator. */

import { CUR_METADATA_VERSION } from "./paths.js";
import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import type { CurrencyAnalysisInput, CurrencyValidationReport } from "./types.js";

export class CurrencyValidator {
  validateConfiguration(
    config: CurrencyIntelligenceConfiguration,
  ): CurrencyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverPerformFinancialConversionsUsingUnvalidatedExchangeData) {
      errors.push(
        "Must never perform financial conversions using unvalidated exchange data",
      );
    }
    if (!config.preserveFinancialTraceability) {
      errors.push("Financial traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-05");
    }
    if (!config.supportedCurrencies?.length) {
      errors.push("At least one supported currency is required");
    }
    if (!config.enabled) warnings.push("Currency Intelligence disabled");
    return {
      validationReportId: `cur-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CUR_METADATA_VERSION,
    };
  }

  validateInput(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
    opts: { requireExchangeValidation?: boolean } = {},
  ): CurrencyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Currency Intelligence is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Currency intelligence requires validated=true");
    }
    if (
      opts.requireExchangeValidation &&
      input.exchangeDataValidated !== true &&
      input.validated !== true
    ) {
      errors.push(
        "Never perform financial conversions using unvalidated exchange data",
      );
    }
    if (!input.currencyCode?.trim()) {
      warnings.push("No currency code provided — default structural currency will be used");
    }
    return {
      validationReportId: `cur-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CUR_METADATA_VERSION,
    };
  }
}
