/** R4-02 — CRM validation engine. */

import { CRM_METADATA_VERSION } from "./paths.js";
import type { CrmFoundationConfiguration } from "./configuration.js";
import type { CrmRecord, CrmValidationReport, LifecycleStatus } from "./types.js";

export class CrmValidationEngine {
  validateCrmRecord(
    record: CrmRecord,
    config: CrmFoundationConfiguration,
  ): CrmValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.crmRecordId) errors.push("Missing CRM record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.customerProfileReference) errors.push("Missing customer profile reference");

    if (config.lifecycleRulesEnabled) {
      const allowed = config.lifecycleRules.filter((r) => r.enabled).map((r) => r.status);
      if (!allowed.includes(record.customerLifecycleStatus)) {
        errors.push(`Invalid lifecycle status: ${record.customerLifecycleStatus}`);
      }
    }

    if (config.validationRulesEnabled && !record.contactInformation.email && !record.contactInformation.phone) {
      warnings.push("No contact email or phone on record");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `crm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }

  validateLifecycleTransition(
    from: LifecycleStatus,
    to: LifecycleStatus,
    config: CrmFoundationConfiguration,
  ): CrmValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.lifecycleRulesEnabled) {
      const fromRule = config.lifecycleRules.find((r) => r.status === from);
      const toRule = config.lifecycleRules.find((r) => r.status === to);
      if (!fromRule?.enabled) warnings.push(`Source lifecycle ${from} not enabled`);
      if (!toRule?.enabled) errors.push(`Target lifecycle ${to} not enabled`);
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `crm-val-lifecycle-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }
}
