/** X3-18 — Simulation Metadata Generator. */

import { SSI_METADATA_VERSION } from "./paths.js";
import type {
  ScaleSimulationRecommendation,
  ScaleSimulationEngineRecord,
  ScaleSimulationRecord,
  SimulationValidationReport,
  SsiRunReport,
} from "./types.js";

export function buildScaleSimulationEngineRunReportId(): string {
  return `ssi-run-${Date.now()}`;
}

export class SimulationMetadataGenerator {
  buildRunReport(input: {
    action: SsiRunReport["action"];
    engineRecord: ScaleSimulationEngineRecord;
    simulationRecords?: ScaleSimulationRecord[];
    recommendations?: ScaleSimulationRecommendation[];
    validation: SimulationValidationReport;
    durationMs: number;
  }): SsiRunReport {
    return {
      scaleSimulationEngineRunReportId: buildScaleSimulationEngineRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      simulationRecords: input.simulationRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SSI_METADATA_VERSION,
    };
  }
}
