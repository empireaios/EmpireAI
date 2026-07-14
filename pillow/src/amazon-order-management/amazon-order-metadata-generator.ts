/** R1-04 — Amazon order metadata generator. */

import { AMAZON_ORDER_METADATA_VERSION } from "./paths.js";
import type {
  AmazonOrderChangeSet,
  AmazonOrderLifecycleEvent,
  AmazonOrderRecord,
  AmazonOrderSyncReport,
  AmazonOrderValidationReport,
} from "./types.js";

export function buildSyncReportId(): string {
  return `amzord-sync-${Date.now()}`;
}

export class AmazonOrderMetadataGenerator {
  buildSyncReport(input: {
    action: AmazonOrderSyncReport["action"];
    orders: AmazonOrderRecord[];
    changes: AmazonOrderChangeSet;
    events: AmazonOrderLifecycleEvent[];
    validation: AmazonOrderValidationReport;
    durationMs: number;
  }): AmazonOrderSyncReport {
    return {
      syncReportId: buildSyncReportId(),
      syncTimestamp: new Date().toISOString(),
      action: input.action,
      orders: input.orders,
      changes: input.changes,
      events: input.events,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AMAZON_ORDER_METADATA_VERSION,
    };
  }
}
