/** R3-03 — Banking validator. */

import { BI_METADATA_VERSION } from "./paths.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";
import type {
  BankingIntegrationRecord,
  BankingRecord,
  BankingValidationReport,
} from "./types.js";

export class BankingValidator {
  validateConfiguration(config: BankingIntegrationConfiguration): BankingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef) warnings.push("Credential reference not configured");
    if (!config.bankingProviderRulesEnabled) {
      warnings.push("Banking provider rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `bi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BI_METADATA_VERSION,
    };
  }

  validateIntegrationRecord(record: BankingIntegrationRecord): BankingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.integrationRecordId.startsWith("bi-")) {
      errors.push("Invalid integration record ID prefix");
    }
    if (record.healthStatus === "failed") warnings.push("Integration health is failed");
    if (record.currentOperationalState !== "active") {
      warnings.push(`Integration not active: ${record.currentOperationalState}`);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `bi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BI_METADATA_VERSION,
    };
  }

  validateBankingRecord(record: BankingRecord): BankingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.bankingRecordId.startsWith("bi-acct-")) {
      errors.push("Invalid banking record ID prefix");
    }
    if (!record.bankAccountReference) errors.push("Missing bank account reference");
    if (record.synchronizationStatus === "failed") {
      warnings.push("Synchronization status is failed");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `bi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BI_METADATA_VERSION,
    };
  }
}
