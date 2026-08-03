/** X2-02 — Registry validator. */

import { MCR_METADATA_VERSION } from "./paths.js";
import type { MultiCompanyRegistryConfiguration } from "./configuration.js";
import type {
  AdvanceLifecycleInput,
  ClassifyCompanyInput,
  CompanyRegistryRecord,
  RegisterCompanyInput,
  RegistryValidationReport,
  UpdateCompanyProfileInput,
  UpdateOwnershipInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class RegistryValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): RegistryValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `mcr-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MCR_METADATA_VERSION,
    };
  }

  validateConfiguration(config: MultiCompanyRegistryConfiguration): RegistryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Multi-Company Registry disabled by configuration");
    if (!config.neverRegisterDuplicatesWithoutValidation) {
      errors.push("Duplicate registration without validation is forbidden");
    }
    if (!config.preserveCompanyTraceability) errors.push("Company traceability must remain enabled");
    if (!config.preserveEnterpriseIntegrity) errors.push("Enterprise integrity must remain enabled");
    return this.report(started, errors, warnings);
  }

  validateRegistration(
    input: RegisterCompanyInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.registrationRulesEnabled) {
      warnings.push("Registration rules disabled by configuration");
    }
    if (!input.companyName || input.companyName.trim().length === 0) {
      errors.push("Missing company name");
    }
    if (SENSITIVE.test(input.companyName ?? "")) {
      errors.push("Company name must not contain credentials");
    }
    if (input.ownershipReference && SENSITIVE.test(input.ownershipReference)) {
      errors.push("Ownership reference must not contain credentials");
    }
    if (input.validated !== true) {
      errors.push("Company registration requires validated=true");
    }
    if (input.allowDuplicate === true && input.validated !== true) {
      errors.push("Duplicate registration requires validation");
    }

    return this.report(started, errors, warnings);
  }

  validateProfileUpdate(
    input: UpdateCompanyProfileInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.companyId) errors.push("Missing company ID");
    if (input.validated !== true) errors.push("Profile update requires validated=true");
    if (input.companyName && SENSITIVE.test(input.companyName)) {
      errors.push("Company name must not contain credentials");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateOwnership(
    input: UpdateOwnershipInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.companyId) errors.push("Missing company ID");
    if (!input.ownershipReference) errors.push("Missing ownership reference");
    if (SENSITIVE.test(input.ownershipReference ?? "")) {
      errors.push("Ownership reference must not contain credentials");
    }
    if (input.validated !== true) errors.push("Ownership update requires validated=true");
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateClassification(
    input: ClassifyCompanyInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.companyId) errors.push("Missing company ID");
    if (!input.companyCategory) errors.push("Missing company category");
    if (input.validated !== true) errors.push("Classification requires validated=true");
    if (!config.classificationRulesEnabled) warnings.push("Classification rules disabled");
    return this.report(started, errors, warnings);
  }

  validateLifecycle(
    input: AdvanceLifecycleInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.companyId) errors.push("Missing company ID");
    if (!input.companyLifecycleStage) errors.push("Missing lifecycle stage");
    if (input.validated !== true) errors.push("Lifecycle advance requires validated=true");
    if (!config.lifecycleRulesEnabled) warnings.push("Lifecycle rules disabled");
    return this.report(started, errors, warnings);
  }

  validateRecord(record: CompanyRegistryRecord): RegistryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.companyRegistryId.startsWith("mcr-")) {
      errors.push("Invalid company registry ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.bypassedValidation) errors.push("Validation bypass is forbidden");
    if (record.validationStatus === "failed") warnings.push("Record validation status is failed");
    return this.report(started, errors, warnings);
  }
}
