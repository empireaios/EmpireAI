/** R4-01 — Customer validation engine. */

import { CIE_METADATA_VERSION } from "./paths.js";
import type { CustomerIdentityEngineConfiguration } from "./configuration.js";
import type {
  CustomerIdentityRecord,
  CustomerIdentifier,
  IdentityValidationReport,
} from "./types.js";

export class CustomerValidationEngine {
  validateCustomerRecord(
    record: CustomerIdentityRecord,
    config: CustomerIdentityEngineConfiguration,
  ): IdentityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.timestamp) errors.push("Missing timestamp");

    const hasIdentifier =
      record.customerIdentifiers.length > 0 ||
      record.contactReferences.length > 0 ||
      record.marketplaceReferences.length > 0 ||
      record.communicationReferences.length > 0;

    if (!hasIdentifier) {
      if (config.validationRulesEnabled) {
        warnings.push("Customer record has no identifiers or references");
      }
    }

    for (const id of record.customerIdentifiers) {
      if (!id.identifierValue?.trim()) {
        errors.push(`Empty identifier value for type ${id.identifierType}`);
      }
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cie-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }

  validateMergeCandidates(
    source: CustomerIdentityRecord,
    target: CustomerIdentityRecord,
    config: CustomerIdentityEngineConfiguration,
  ): IdentityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (source.customerId === target.customerId) {
      errors.push("Source and target customer IDs are identical");
    }
    if (source.identityStatus === "merged") {
      errors.push("Source identity already merged");
    }
    if (target.identityStatus === "merged") {
      errors.push("Target identity already merged");
    }

    const sourceValidation = this.validateCustomerRecord(source, config);
    const targetValidation = this.validateCustomerRecord(target, config);
    errors.push(...sourceValidation.errors, ...targetValidation.errors);
    warnings.push(...sourceValidation.warnings, ...targetValidation.warnings);

    const mergeRule = config.mergeRules.find((r) => r.ruleId === "validated_merge");
    if (mergeRule?.enabled && mergeRule.requireValidation) {
      if (sourceValidation.decision === "fail" || targetValidation.decision === "fail") {
        errors.push("Merge blocked: validation required before merge");
      }
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cie-val-merge-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }

  validateIdentifier(identifier: CustomerIdentifier): IdentityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!identifier.identifierType) errors.push("Missing identifier type");
    if (!identifier.identifierValue?.trim()) errors.push("Missing identifier value");

    if (identifier.identifierType === "email" && identifier.identifierValue) {
      if (!identifier.identifierValue.includes("@")) {
        warnings.push("Email identifier may be invalid");
      }
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cie-val-id-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }
}
