/** R5-11 — Creative Metadata Generator. */

import {
  CRA_CAPABILITIES,
  CRA_METADATA_VERSION,
  CREATIVE_ASSET_MANAGER_ID,
} from "./paths.js";
import type {
  AssetUsageEvent,
  AssetVersionRecord,
  CreativeAssetRecord,
  CreativeEngineRecord,
  CreativeRunReport,
  CreativeValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class CreativeMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: CreativeEngineRecord["dependencyPresence"];
  }): CreativeEngineRecord {
    return {
      engineRecordId: `cra-${CREATIVE_ASSET_MANAGER_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CREATIVE_ASSET_MANAGER_ID,
      engineVersion: CRA_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CRA_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: CRA_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: CreativeRunReport["action"];
    engineRecord: CreativeEngineRecord;
    assetRecords: CreativeAssetRecord[];
    versions: AssetVersionRecord[];
    usageEvents: AssetUsageEvent[];
    validation: CreativeValidationReport;
    durationMs: number;
  }): CreativeRunReport {
    return {
      creativeRunReportId: `cra-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      assetRecords: input.assetRecords,
      versions: input.versions,
      usageEvents: input.usageEvents,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CRA_METADATA_VERSION,
    };
  }
}
