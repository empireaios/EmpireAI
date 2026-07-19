/** R2-07 — Pricing Metadata Generator. */

import type { SupplierPricingSyncReport } from "./types.js";
import { SPE_METADATA_VERSION } from "./paths.js";

export function buildSyncReportId(): string {
  return `spe-run-${Date.now()}`;
}

export class PricingMetadataGenerator {
  generateSyncReport(input: {
    action: SupplierPricingSyncReport["action"];
    pricing: SupplierPricingSyncReport["pricing"];
    changes: SupplierPricingSyncReport["changes"];
    history: SupplierPricingSyncReport["history"];
    invalidRecords: SupplierPricingSyncReport["invalidRecords"];
    validation: SupplierPricingSyncReport["validation"];
    durationMs: number;
  }): SupplierPricingSyncReport {
    return {
      syncReportId: buildSyncReportId(),
      syncTimestamp: new Date().toISOString(),
      action: input.action,
      pricing: input.pricing,
      changes: input.changes,
      history: input.history,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SPE_METADATA_VERSION,
    };
  }
}
