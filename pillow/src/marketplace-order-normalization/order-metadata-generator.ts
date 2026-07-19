/** R1-13 — Order metadata generator. */

import { MON_METADATA_VERSION, UNIFIED_ORDER_SCHEMA_VERSION } from "./paths.js";
import type {
  DuplicateOrderGroup,
  InvalidOrderFinding,
  MissingAttributeFinding,
  NormalizedOrderRecord,
  OrderNormalizationReport,
  OrderNormalizationValidationReport,
} from "./types.js";

export function buildNormalizationReportId(): string {
  return `mon-run-${Date.now()}`;
}

export class OrderMetadataGenerator {
  buildNormalizationReport(input: {
    action: OrderNormalizationReport["action"];
    orders: NormalizedOrderRecord[];
    duplicates: DuplicateOrderGroup[];
    missingAttributes: MissingAttributeFinding[];
    invalidOrders: InvalidOrderFinding[];
    validation: OrderNormalizationValidationReport;
    durationMs: number;
  }): OrderNormalizationReport {
    return {
      normalizationReportId: buildNormalizationReportId(),
      normalizationTimestamp: new Date().toISOString(),
      action: input.action,
      orders: input.orders,
      duplicates: input.duplicates,
      missingAttributes: input.missingAttributes,
      invalidOrders: input.invalidOrders,
      validation: input.validation,
      durationMs: input.durationMs,
      schemaVersion: UNIFIED_ORDER_SCHEMA_VERSION,
      metadataVersion: MON_METADATA_VERSION,
    };
  }
}
