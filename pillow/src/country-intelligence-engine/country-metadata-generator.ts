/** X4-02 — Country Metadata Generator. */

import { CIE_METADATA_VERSION } from "./paths.js";
import type {
  CountryIntelligenceEngineRecord,
  CountryIntelligenceRecord,
  CountryRecommendation,
  CountryValidationReport,
  CieRunReport,
} from "./types.js";

export function buildCountryRunReportId(): string {
  return `cie-run-${Date.now()}`;
}

export class CountryMetadataGenerator {
  buildRunReport(input: {
    action: CieRunReport["action"];
    engineRecord: CountryIntelligenceEngineRecord;
    countryRecords?: CountryIntelligenceRecord[];
    recommendations?: CountryRecommendation[];
    validation: CountryValidationReport;
    durationMs: number;
  }): CieRunReport {
    return {
      countryRunReportId: buildCountryRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      countryRecords: input.countryRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }
}
