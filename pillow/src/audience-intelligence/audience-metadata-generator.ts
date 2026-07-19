/** R5-08 — Audience Metadata Generator. */

import { AUD_CAPABILITIES, AUD_METADATA_VERSION, AUDIENCE_INTELLIGENCE_ID } from "./paths.js";
import type {
  AudienceEngineRecord,
  AudienceOverlap,
  AudienceRecommendation,
  AudienceRecord,
  AudienceRunReport,
  AudienceValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class AudienceMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: AudienceEngineRecord["dependencyPresence"];
  }): AudienceEngineRecord {
    return {
      engineRecordId: `aud-${AUDIENCE_INTELLIGENCE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AUDIENCE_INTELLIGENCE_ID,
      engineVersion: AUD_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...AUD_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: AUD_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: AudienceRunReport["action"];
    engineRecord: AudienceEngineRecord;
    audienceRecords: AudienceRecord[];
    overlaps: AudienceOverlap[];
    recommendations: AudienceRecommendation[];
    validation: AudienceValidationReport;
    durationMs: number;
  }): AudienceRunReport {
    return {
      audienceRunReportId: `aud-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      audienceRecords: input.audienceRecords,
      overlaps: input.overlaps,
      recommendations: input.recommendations,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AUD_METADATA_VERSION,
    };
  }
}
