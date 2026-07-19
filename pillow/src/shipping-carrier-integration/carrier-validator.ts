/** R2-11 — Carrier validation and metadata. */

import type {
  CarrierFailureFinding,
  CarrierValidationReport,
  CreateShipmentRequestInput,
  InvalidShipmentFinding,
  ShipmentRecord,
} from "./types.js";
import type { ShippingCarrierIntegrationConfiguration } from "./configuration.js";
import { SCI_METADATA_VERSION } from "./paths.js";
import { SUPPORTED_CARRIER_IDENTIFIERS } from "./paths.js";

export class CarrierValidationEngine {
  detectInvalidShipmentRequest(input: CreateShipmentRequestInput): InvalidShipmentFinding | null {
    const orderRef = input.orderReference ?? "";
    const errors: string[] = [];

    if (input.carrierId && !(SUPPORTED_CARRIER_IDENTIFIERS as readonly string[]).includes(input.carrierId)) {
      errors.push(`Unsupported carrier: ${input.carrierId}`);
    }

    if (errors.length) {
      return { orderReference: orderRef || "unknown", errors };
    }
    return null;
  }

  validateShipmentRecords(
    records: ShipmentRecord[],
    config: ShippingCarrierIntegrationConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.shipmentId)) errors.push(`Duplicate shipment ID: ${record.shipmentId}`);
      seen.add(record.shipmentId);
      if (!record.shipmentId.startsWith("sci-")) {
        errors.push(`Invalid shipment ID prefix: ${record.shipmentId}`);
      }
      if (!record.shipmentRequestId.startsWith("sci-req-")) {
        warnings.push(`Unexpected shipment request ID format: ${record.shipmentRequestId}`);
      }
    }

    return { errors, warnings };
  }
}

export class CarrierValidator {
  private readonly validationEngine = new CarrierValidationEngine();

  validateShipmentResult(input: {
    records: ShipmentRecord[];
    failures: CarrierFailureFinding[];
    config: ShippingCarrierIntegrationConfiguration;
    startedAt: number;
  }): CarrierValidationReport {
    const { errors, warnings } = this.validationEngine.validateShipmentRecords(
      input.records,
      input.config,
    );

    if (input.failures.length) {
      warnings.push(`${input.failures.length} carrier failure(s) detected`);
    }

    let decision: CarrierValidationReport["decision"] = "pass";
    if (errors.length) {
      decision = warnings.length ? "partial" : "fail";
    } else if (warnings.length) {
      decision = "partial";
    }

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass"
          ? ("passed" as const)
          : decision === "partial"
            ? ("partial" as const)
            : ("failed" as const),
    }));

    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `sci-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: SCI_METADATA_VERSION,
    };
  }
}

export function buildShipmentReportId(): string {
  return `sci-run-${Date.now()}`;
}

export class CarrierMetadataGenerator {
  generateShipmentReport(input: {
    action: import("./types.js").ShipmentReport["action"];
    records: ShipmentRecord[];
    rates: import("./types.js").ShippingRateQuote[];
    failures: CarrierFailureFinding[];
    invalidRequests: InvalidShipmentFinding[];
    validation: CarrierValidationReport;
    durationMs: number;
  }): import("./types.js").ShipmentReport {
    return {
      shipmentReportId: buildShipmentReportId(),
      shipmentTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      rates: input.rates,
      failures: input.failures,
      invalidRequests: input.invalidRequests,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SCI_METADATA_VERSION,
    };
  }
}
