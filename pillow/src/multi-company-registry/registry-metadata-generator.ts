/** X2-02 — Registry metadata generator. */

import { MCR_METADATA_VERSION } from "./paths.js";
import type {
  CompanyRegistryRecord,
  RegistryEngineRecord,
  RegistryRecommendation,
  RegistryRunReport,
  RegistryValidationReport,
} from "./types.js";

export function buildRegistryRunReportId(): string {
  return `mcr-run-${Date.now()}`;
}

export class RegistryMetadataGenerator {
  buildRunReport(input: {
    action: RegistryRunReport["action"];
    engineRecord: RegistryEngineRecord;
    companyRecords: CompanyRegistryRecord[];
    recommendations?: RegistryRecommendation[];
    validation: RegistryValidationReport;
    durationMs: number;
  }): RegistryRunReport {
    return {
      registryRunReportId: buildRegistryRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      companyRecords: input.companyRecords,
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: MCR_METADATA_VERSION,
    };
  }
}
