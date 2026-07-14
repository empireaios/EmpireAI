/** R1-01 — Connector metadata generator. */

import { CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  ConnectorValidationReport,
  FrameworkRunReport,
  MarketplaceConnectorRecord,
} from "./types.js";

export function buildConnectorId(marketplaceId: string): string {
  return `mcf-${marketplaceId}-${Date.now()}`;
}

export function buildFrameworkRunReportId(): string {
  return `mcf-run-${Date.now()}`;
}

export class ConnectorMetadataGenerator {
  buildRunReport(input: {
    action: FrameworkRunReport["action"];
    records: MarketplaceConnectorRecord[];
    validation: ConnectorValidationReport;
    durationMs: number;
  }): FrameworkRunReport {
    return {
      frameworkRunReportId: buildFrameworkRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CONNECTOR_METADATA_VERSION,
    };
  }
}
