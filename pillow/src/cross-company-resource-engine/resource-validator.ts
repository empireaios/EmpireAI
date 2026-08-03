/** X2-11 — Resource Validator. */

import { CCRE_METADATA_VERSION, RESOURCE_CATEGORIES } from "./paths.js";
import type { CrossCompanyResourceEngineConfiguration } from "./configuration.js";
import type {
  AllocateResourceInput,
  RegisterResourceInput,
  ResourceAllocationRecord,
  ResourceValidationReport,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class ResourceValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ResourceValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ccre-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CCRE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Cross-Company Resource Engine disabled");
    if (!config.neverAllocateProtectedResourcesWithoutAuthorization) {
      errors.push("Protected resource authorization guard must remain enabled");
    }
    if (!config.preserveAllocationTraceability) {
      errors.push("Allocation traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRegister(
    input: RegisterResourceInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.resourceIdentifier?.trim()) errors.push("Missing resource identifier");
    if (SENSITIVE.test(input.resourceIdentifier ?? "")) {
      errors.push("Resource identifier must not contain credentials");
    }
    if (!input.owningCompany?.trim()) errors.push("Missing owning company");
    if (SENSITIVE.test(input.owningCompany ?? "")) {
      errors.push("Owning company must not contain credentials");
    }
    if (!RESOURCE_CATEGORIES.includes(input.resourceCategory)) {
      errors.push("Invalid resource category");
    }
    if (input.validated !== true) errors.push("Resource registration requires validated=true");
    if (
      input.protectedResource &&
      input.authorizedAllocation !== true &&
      config.neverAllocateProtectedResourcesWithoutAuthorization
    ) {
      warnings.push("Protected resource registered without authorization — allocation will be blocked");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateAllocate(
    input: AllocateResourceInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.resourceIdentifier?.trim()) errors.push("Missing resource identifier");
    if (!input.assignedCompany?.trim()) errors.push("Missing assigned company");
    if (SENSITIVE.test(input.assignedCompany ?? "")) {
      errors.push("Assigned company must not contain credentials");
    }
    if (input.validated !== true) errors.push("Resource allocation requires validated=true");
    if (!config.resourceAllocationRulesEnabled) warnings.push("Allocation rules disabled");
    if (!config.resourceSharingPoliciesEnabled) warnings.push("Sharing policies disabled");
    return this.report(started, errors, warnings);
  }

  validateRecord(record: ResourceAllocationRecord): ResourceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.resourceAllocationId.startsWith("ccre-")) {
      errors.push("Invalid resource allocation ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.sensitiveEnterpriseData) {
      errors.push("Sensitive enterprise data must not enter resource records");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Resource records must remain structural signals only");
    }
    if (record.utilizationScore < 0 || record.utilizationScore > 100) {
      errors.push("Utilization score out of range");
    }
    if (
      record.protectedResource &&
      !record.authorizedAllocation &&
      (record.allocationStatus === "allocated" || record.allocationStatus === "shared")
    ) {
      warnings.push("Protected resource allocated without authorization flag");
    }
    return this.report(started, errors, warnings);
  }
}
