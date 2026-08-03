/** X2-05 — Capital validator. */

import { CDE_METADATA_VERSION } from "./paths.js";
import type { CapitalDistributionEngineConfiguration } from "./configuration.js";
import type {
  AllocateCapitalInput,
  CapitalAllocationRecord,
  CapitalValidationReport,
  EvaluateFundingInput,
  ManageCapitalPoolInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|bank|iban|swift)/i;

export class CapitalValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): CapitalValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cde-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CDE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: CapitalDistributionEngineConfiguration,
  ): CapitalValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Capital Distribution Engine disabled");
    if (!config.neverAllocateBeyondApprovalPolicy) {
      errors.push("Allocation beyond approval policy is forbidden");
    }
    if (!config.preserveAllocationTraceability) {
      errors.push("Allocation traceability must remain enabled");
    }
    if (!config.preserveFinancialIntegrity) {
      errors.push("Financial integrity must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validatePool(
    input: ManageCapitalPoolInput,
    config: CapitalDistributionEngineConfiguration,
  ): CapitalValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) errors.push("Capital pool management requires validated=true");
    if (typeof input.availableUnits === "number" && input.availableUnits < 0) {
      errors.push("Available units cannot be negative");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateFunding(
    input: EvaluateFundingInput | AllocateCapitalInput,
    config: CapitalDistributionEngineConfiguration,
  ): CapitalValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.companyReference?.trim()) errors.push("Missing company reference");
    if (SENSITIVE.test(input.companyReference ?? "")) {
      errors.push("Company reference must not contain credentials");
    }
    if (!(typeof input.requestedCapital === "number") || !Number.isFinite(input.requestedCapital)) {
      errors.push("Missing financial data — requested capital required");
    } else if (input.requestedCapital <= 0) {
      errors.push("Requested capital must be positive");
    }
    if (input.validated !== true) errors.push("Capital evaluation requires validated=true");
    if (!config.allocationRulesEnabled) warnings.push("Allocation rules disabled");
    if (!config.roiEvaluationRulesEnabled) warnings.push("ROI evaluation rules disabled");

    return this.report(started, errors, warnings);
  }

  validateRecord(record: CapitalAllocationRecord): CapitalValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.capitalAllocationId.startsWith("cde-")) {
      errors.push("Invalid capital allocation ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.sensitiveFinancialData) {
      errors.push("Sensitive financial data must not enter allocation records");
    }
    if (record.approvedAllocation > record.requestedCapital) {
      errors.push("Approved allocation cannot exceed requested capital");
    }
    if (record.autoApproved && record.requiresManualApproval) {
      errors.push("Conflicting approval policy flags");
    }
    return this.report(started, errors, warnings);
  }
}
