/** R4-16 — Segmentation validator. */

import { CSEG_METADATA_VERSION } from "./paths.js";
import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";
import type {
  SegmentationEngineRecord,
  SegmentationRecord,
  SegmentationValidationReport,
} from "./types.js";

export class SegmentationValidator {
  validateConfiguration(
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.minSegmentConfidence < 0 || config.minSegmentConfidence > 100) {
      errors.push("minSegmentConfidence must be between 0 and 100");
    }

    return {
      validationReportId: `cseg-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: SegmentationEngineRecord): SegmentationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) warnings.push("Customer Identity Engine not connected");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cseg-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }
}

export class SegmentationValidationEngine {
  validateSegmentationRecord(
    record: SegmentationRecord,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.customerId?.trim()) errors.push("Customer ID is required");
    if (record.segmentConfidence < 0 || record.segmentConfidence > 100) {
      errors.push("Segment confidence must be between 0 and 100");
    }
    if (record.assignedSegments.length === 0) {
      warnings.push("No segments assigned");
    }
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled — partial validation only");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cseg-val-rec-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }
}
