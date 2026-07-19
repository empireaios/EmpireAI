/** R2-12 — Tracking validation and metadata. */

import type {
  InvalidTrackingFinding,
  ShipmentTrackingRecord,
  TrackingFailureFinding,
  TrackingValidationReport,
} from "./types.js";
import type { ShipmentTrackingEngineConfiguration } from "./configuration.js";
import { STE_METADATA_VERSION } from "./paths.js";

export class TrackingValidationEngine {
  detectInvalidShipment(shipmentId: string, trackingNumber: string | null): InvalidTrackingFinding | null {
    const errors: string[] = [];
    if (!shipmentId) errors.push("Missing shipment ID");
    if (!trackingNumber) errors.push("Missing tracking number");
    if (errors.length) return { shipmentId: shipmentId || "unknown", errors };
    return null;
  }

  validateTrackingRecords(
    records: ShipmentTrackingRecord[],
    config: ShipmentTrackingEngineConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.trackingRecordId)) {
        errors.push(`Duplicate tracking record: ${record.trackingRecordId}`);
      }
      seen.add(record.trackingRecordId);
      if (!record.trackingRecordId.startsWith("ste-")) {
        errors.push(`Invalid tracking record ID prefix: ${record.trackingRecordId}`);
      }
      if (!record.trackingNumber.startsWith("TRK-")) {
        warnings.push(`Unexpected tracking number format: ${record.trackingNumber}`);
      }
    }
    return { errors, warnings };
  }
}

export class TrackingValidator {
  private readonly validationEngine = new TrackingValidationEngine();

  validateTrackingResult(input: {
    records: ShipmentTrackingRecord[];
    failures: TrackingFailureFinding[];
    config: ShipmentTrackingEngineConfiguration;
    startedAt: number;
  }): TrackingValidationReport {
    const { errors, warnings } = this.validationEngine.validateTrackingRecords(
      input.records,
      input.config,
    );
    if (input.failures.length) warnings.push(`${input.failures.length} tracking failure(s) detected`);

    let decision: TrackingValidationReport["decision"] = "pass";
    if (errors.length) decision = warnings.length ? "partial" : "fail";
    else if (warnings.length) decision = "partial";

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));
    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `ste-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: STE_METADATA_VERSION,
    };
  }
}

export function buildTrackingReportId(): string {
  return `ste-run-${Date.now()}`;
}

export class TrackingMetadataGenerator {
  generateTrackingReport(input: {
    action: import("./types.js").ShipmentTrackingReport["action"];
    records: ShipmentTrackingRecord[];
    events: import("./types.js").TrackingEvent[];
    failures: TrackingFailureFinding[];
    invalidRecords: InvalidTrackingFinding[];
    validation: TrackingValidationReport;
    durationMs: number;
  }): import("./types.js").ShipmentTrackingReport {
    return {
      trackingReportId: buildTrackingReportId(),
      trackingTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      events: input.events,
      failures: input.failures,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: STE_METADATA_VERSION,
    };
  }
}
