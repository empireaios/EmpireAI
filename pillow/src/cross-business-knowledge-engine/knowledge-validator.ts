/** X2-04 — Knowledge validator. */

import { CBK_METADATA_VERSION } from "./paths.js";
import type { CrossBusinessKnowledgeEngineConfiguration } from "./configuration.js";
import type {
  ClassifyKnowledgeInput,
  CollectKnowledgeInput,
  KnowledgeRecord,
  KnowledgeValidationReport,
  ShareKnowledgeInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|confidential)/i;

export class KnowledgeValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): KnowledgeValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cbk-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CBK_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Cross-Business Knowledge Engine disabled");
    if (!config.neverShareConfidentialWithoutValidation) {
      errors.push("Confidential sharing without validation is forbidden");
    }
    if (!config.preserveKnowledgeTraceability) {
      errors.push("Knowledge traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateCollect(
    input: CollectKnowledgeInput,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.sourceCompany?.trim()) errors.push("Missing source company");
    if (!input.knowledgeSummary?.trim()) errors.push("Missing knowledge summary");
    if (SENSITIVE.test(input.knowledgeSummary ?? "")) {
      errors.push("Knowledge summary must not contain confidential credentials");
    }
    if (SENSITIVE.test(input.sourceCompany ?? "")) {
      errors.push("Source company must not contain credentials");
    }
    if (input.validated !== true) {
      errors.push("Knowledge collection requires validated=true");
    }
    if (!config.knowledgeCollectionRulesEnabled) {
      warnings.push("Knowledge collection rules disabled");
    }
    if (
      typeof input.reusabilityScore === "number" &&
      input.reusabilityScore < config.minReusabilityScore
    ) {
      warnings.push("Reusability score below configured minimum");
    }
    if (
      typeof input.confidenceScore === "number" &&
      input.confidenceScore < config.minConfidenceScore
    ) {
      warnings.push("Confidence score below configured minimum");
    }

    return this.report(started, errors, warnings);
  }

  validateClassify(
    input: ClassifyKnowledgeInput,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.knowledgeRecordId) errors.push("Missing knowledge record ID");
    if (!input.knowledgeCategory) errors.push("Missing knowledge category");
    if (input.validated !== true) errors.push("Knowledge classification requires validated=true");
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateShare(
    input: ShareKnowledgeInput,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.knowledgeRecordId) errors.push("Missing knowledge record ID");
    if (input.validated !== true) {
      errors.push("Knowledge sharing requires validated=true — confidential content cannot be shared without validation");
    }
    if (!config.knowledgeSharingRulesEnabled) {
      warnings.push("Knowledge sharing rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRecord(record: KnowledgeRecord): KnowledgeValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.knowledgeRecordId.startsWith("cbk-")) {
      errors.push("Invalid knowledge record ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.confidentialContent) {
      errors.push("Confidential content must not enter the knowledge repository");
    }
    if (record.reusabilityScore < 0 || record.reusabilityScore > 100) {
      errors.push("Reusability score out of range");
    }
    return this.report(started, errors, warnings);
  }
}
