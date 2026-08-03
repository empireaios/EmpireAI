/** X3-17 — Profit Validator. */



import { PSE_METADATA_VERSION } from "./paths.js";

import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type { ProfitScalingInput, ProfitValidationReport } from "./types.js";



const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary|bank|iban)/i;



export class ProfitValidator {

  private report(

    started: number,

    errors: string[],

    warnings: string[],

  ): ProfitValidationReport {

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {

      validationReportId: `pse-val-${Date.now()}`,

      validationTimestamp: new Date().toISOString(),

      decision,

      errors,

      warnings,

      durationMs: Date.now() - started,

      metadataVersion: PSE_METADATA_VERSION,

    };

  }



  validateConfiguration(

    config: ProfitScalingEngineConfiguration,

  ): ProfitValidationReport {

    const started = Date.now();

    const errors: string[] = [];

    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Profit Scaling Engine disabled");

    if (!config.neverPrioritizeGrowthOverValidatedProfitability) {

      errors.push("Must never prioritize growth over validated profitability");

    }

    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");

    if (!config.neverExposeAuthenticationTokens) {

      errors.push("Authentication token protection must remain enabled");

    }

    if (!config.preserveProfitTraceability) {

      errors.push("Profit traceability must remain enabled");

    }

    if (!config.preserveFinancialIntegrity) {

      errors.push("Financial integrity must remain enabled");

    }

    if (!config.structuralSignalsOnly) {

      errors.push("Structural signals only must remain enabled");

    }

    if (!config.neverLogSensitiveFinancialInformation) {

      errors.push("Sensitive financial log guard must remain enabled");

    }

    return this.report(started, errors, warnings);

  }



  validateProfitScaling(

    label: string,

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): ProfitValidationReport {

    const started = Date.now();

    const errors: string[] = [];

    const warnings: string[] = [];

    if (input.validated !== true) {

      errors.push(

        `${label} requires validated=true — never prioritize growth over validated profitability`,

      );

    }

    if (input.companyReference && SENSITIVE.test(input.companyReference)) {

      errors.push("Company reference must not contain sensitive data");

    }

    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");

    if (!config.neverPrioritizeGrowthOverValidatedProfitability) {

      errors.push("Prioritizing growth over validated profitability is forbidden");

    }

    return this.report(started, errors, warnings);

  }

}

