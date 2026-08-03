/** X3-04 — Capacity Metadata Generator. */

import { CPE_METADATA_VERSION } from "./paths.js";
import type {
  CapacityPlanningEngineRecord,
  CapacityPlanningRecord,
  CapacityRecommendation,
  CapacityValidationReport,
  CpeRunReport,
} from "./types.js";

export function buildCapacityPlanningRunReportId(): string {
  return `cpe-run-${Date.now()}`;
}

export class CapacityMetadataGenerator {
  buildRunReport(input: {
    action: CpeRunReport["action"];
    engineRecord: CapacityPlanningEngineRecord;
    planningRecords?: CapacityPlanningRecord[];
    recommendations?: CapacityRecommendation[];
    validation: CapacityValidationReport;
    durationMs: number;
  }): CpeRunReport {
    return {
      capacityPlanningRunReportId: buildCapacityPlanningRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      planningRecords: input.planningRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CPE_METADATA_VERSION,
    };
  }
}
