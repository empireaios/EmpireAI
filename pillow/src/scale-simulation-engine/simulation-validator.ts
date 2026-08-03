/** X3-18 — Simulation Validator. */

import { SSI_METADATA_VERSION } from "./paths.js";
import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type { ScaleSimulationInput, SimulationValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary|bank|iban)/i;

export class SimulationValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): SimulationValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ssi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SSI_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: ScaleSimulationEngineConfiguration,
  ): SimulationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Scale Simulation Engine disabled");
    if (!config.neverExecuteSimulatedActionsAgainstProduction) {
      errors.push("Must never execute simulated actions against production");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveSimulationTraceability) {
      errors.push("Simulation traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only must remain enabled");
    }
    if (!config.neverLogSensitiveEnterpriseInformation) {
      errors.push("Sensitive enterprise log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateSimulation(
    label: string,
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SimulationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never execute simulated actions against production`,
      );
    }
    if (input.executeAgainstProduction === true) {
      errors.push(
        `${label} refused — never execute simulated actions against production systems`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverExecuteSimulatedActionsAgainstProduction) {
      errors.push("Executing simulated actions against production is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
