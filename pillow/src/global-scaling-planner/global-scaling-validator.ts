/** X3-14 — Global Scaling Validator. */



import { GSP_METADATA_VERSION } from "./paths.js";

import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type { GlobalScalingInput, GlobalScalingValidationReport } from "./types.js";



const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary)/i;



export class GlobalScalingValidator {

  private report(

    started: number,

    errors: string[],

    warnings: string[],

  ): GlobalScalingValidationReport {

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {

      validationReportId: `gsp-val-${Date.now()}`,

      validationTimestamp: new Date().toISOString(),

      decision,

      errors,

      warnings,

      durationMs: Date.now() - started,

      metadataVersion: GSP_METADATA_VERSION,

    };

  }



  validateConfiguration(

    config: GlobalScalingPlannerConfiguration,

  ): GlobalScalingValidationReport {

    const started = Date.now();

    const errors: string[] = [];

    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Global Scaling Planner disabled");

    if (!config.neverRecommendInternationalExpansionWithoutValidatedReadiness) {

      errors.push("Must never recommend international expansion without validated readiness");

    }

    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");

    if (!config.neverExposeAuthenticationTokens) {

      errors.push("Authentication token protection must remain enabled");

    }

    if (!config.preservePlanningTraceability) {

      errors.push("Planning traceability must remain enabled");

    }

    if (!config.preserveEnterpriseIntegrity) {

      errors.push("Enterprise integrity must remain enabled");

    }

    if (!config.structuralSignalsOnly) {

      errors.push("Structural signals only must remain enabled");

    }

    if (!config.neverLogSensitiveOperationalInformation) {

      errors.push("Sensitive operational log guard must remain enabled");

    }

    return this.report(started, errors, warnings);

  }



  validateGlobalScaling(

    label: string,

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GlobalScalingValidationReport {

    const started = Date.now();

    const errors: string[] = [];

    const warnings: string[] = [];

    if (input.validated !== true) {

      errors.push(

        `${label} requires validated=true — never recommend international expansion without validated readiness`,

      );

    }

    if (input.companyReference && SENSITIVE.test(input.companyReference)) {

      errors.push("Company reference must not contain sensitive data");

    }

    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");

    if (!config.neverRecommendInternationalExpansionWithoutValidatedReadiness) {

      errors.push("Recommending expansion without validated readiness is forbidden");

    }

    return this.report(started, errors, warnings);

  }

}


