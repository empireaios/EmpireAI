/** R5-09 — Attribution Metadata Generator. */

import { ATT_CAPABILITIES, ATT_METADATA_VERSION, ATTRIBUTION_ENGINE_ID } from "./paths.js";
import type {
  AttributionEngineRecord,
  AttributionRecord,
  AttributionRunReport,
  AttributionValidationReport,
  ContributionBreakdown,
  OperationalState,
  RoiSnapshot,
  TouchpointRecord,
  ValidationStatus,
} from "./types.js";

export class AttributionMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: AttributionEngineRecord["dependencyPresence"];
  }): AttributionEngineRecord {
    return {
      engineRecordId: `att-${ATTRIBUTION_ENGINE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ATTRIBUTION_ENGINE_ID,
      engineVersion: ATT_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...ATT_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: ATT_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: AttributionRunReport["action"];
    engineRecord: AttributionEngineRecord;
    attributionRecords: AttributionRecord[];
    touchpoints: TouchpointRecord[];
    contributions: ContributionBreakdown[];
    roi: RoiSnapshot | null;
    validation: AttributionValidationReport;
    durationMs: number;
  }): AttributionRunReport {
    return {
      attributionRunReportId: `att-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      attributionRecords: input.attributionRecords,
      touchpoints: input.touchpoints,
      contributions: input.contributions,
      roi: input.roi,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ATT_METADATA_VERSION,
    };
  }
}
