/** R2-10 — Fulfilment Metadata Generator. */

import type { FulfilmentReport } from "./types.js";
import { FO_METADATA_VERSION } from "./paths.js";

export function buildFulfilmentReportId(): string {
  return `fo-run-${Date.now()}`;
}

export class FulfilmentMetadataGenerator {
  generateFulfilmentReport(input: {
    action: FulfilmentReport["action"];
    records: FulfilmentReport["records"];
    routeSelection: FulfilmentReport["routeSelection"];
    failures: FulfilmentReport["failures"];
    invalidRequests: FulfilmentReport["invalidRequests"];
    validation: FulfilmentReport["validation"];
    durationMs: number;
  }): FulfilmentReport {
    return {
      fulfilmentReportId: buildFulfilmentReportId(),
      fulfilmentTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      routeSelection: input.routeSelection,
      failures: input.failures,
      invalidRequests: input.invalidRequests,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: FO_METADATA_VERSION,
    };
  }
}
