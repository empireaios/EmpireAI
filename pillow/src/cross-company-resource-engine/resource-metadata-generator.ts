/** X2-11 — Resource Metadata Generator. */

import { CCRE_METADATA_VERSION } from "./paths.js";
import type {
  ResourceAllocationRecord,
  ResourceConflictSignal,
  ResourceEngineRecord,
  ResourceRecommendation,
  ResourceRunReport,
  ResourceValidationReport,
} from "./types.js";

export function buildResourceRunReportId(): string {
  return `ccre-run-${Date.now()}`;
}

export class ResourceMetadataGenerator {
  buildRunReport(input: {
    action: ResourceRunReport["action"];
    engineRecord: ResourceEngineRecord;
    resourceRecords?: ResourceAllocationRecord[];
    conflictSignals?: ResourceConflictSignal[];
    recommendations?: ResourceRecommendation[];
    validation: ResourceValidationReport;
    durationMs: number;
  }): ResourceRunReport {
    return {
      resourceRunReportId: buildResourceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      resourceRecords: input.resourceRecords ?? [],
      conflictSignals: input.conflictSignals ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CCRE_METADATA_VERSION,
    };
  }
}
