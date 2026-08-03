/** X2-14 — Forecast Metadata Generator. */

import { PFE_METADATA_VERSION } from "./paths.js";
import type {
  ForecastRecord,
  ForecastRunReport,
  ForecastScenario,
  ForecastValidationReport,
  PortfolioForecastEngineRecord,
} from "./types.js";

export function buildForecastRunReportId(): string {
  return `pfe-run-${Date.now()}`;
}

export class ForecastMetadataGenerator {
  buildRunReport(input: {
    action: ForecastRunReport["action"];
    engineRecord: PortfolioForecastEngineRecord;
    forecastRecords?: ForecastRecord[];
    scenarios?: ForecastScenario[];
    validation: ForecastValidationReport;
    durationMs: number;
  }): ForecastRunReport {
    return {
      forecastRunReportId: buildForecastRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      forecastRecords: input.forecastRecords ?? [],
      scenarios: input.scenarios ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PFE_METADATA_VERSION,
    };
  }
}
