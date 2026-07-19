/** R1-14 — Health metadata generator. */

import { HEALTH_RECORD_SCHEMA_VERSION, MHM_METADATA_VERSION } from "./paths.js";
import type {
  FailureFinding,
  HealthAlert,
  HealthValidationReport,
  MarketplaceHealthCheckReport,
  MarketplaceHealthRecord,
} from "./types.js";

export function buildHealthCheckReportId(): string {
  return `mhm-run-${Date.now()}`;
}

export class HealthMetadataGenerator {
  buildHealthCheckReport(input: {
    action: MarketplaceHealthCheckReport["action"];
    records: MarketplaceHealthRecord[];
    alerts: HealthAlert[];
    failures: FailureFinding[];
    validation: HealthValidationReport;
    durationMs: number;
  }): MarketplaceHealthCheckReport {
    return {
      healthCheckReportId: buildHealthCheckReportId(),
      healthCheckTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      alerts: input.alerts,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      schemaVersion: HEALTH_RECORD_SCHEMA_VERSION,
      metadataVersion: MHM_METADATA_VERSION,
    };
  }
}
