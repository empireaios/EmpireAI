/** R2-13 — Return Validation Engine. */

import type { ShipmentTrackingRecord } from "../shipment-tracking-engine/types.js";
import type { ReturnManagementConfiguration } from "./configuration.js";
import type { InvalidReturnFinding, ReturnRecord } from "./types.js";

export class ReturnValidationEngine {
  checkEligibility(
    trackingRecord: ShipmentTrackingRecord | null,
    config: ReturnManagementConfiguration,
  ): InvalidReturnFinding | null {
    if (!config.returnEligibilityRulesEnabled) return null;
    if (!trackingRecord) {
      return { returnId: "unknown", errors: ["Missing shipment tracking record"] };
    }
    if (trackingRecord.currentShipmentStatus !== "delivered") {
      return {
        returnId: trackingRecord.shipmentId,
        errors: [`Shipment not eligible — status: ${trackingRecord.currentShipmentStatus}`],
      };
    }
    return null;
  }

  detectInvalidReturn(returnId: string, orderReference: string, shipmentReference: string): InvalidReturnFinding | null {
    const errors: string[] = [];
    if (!returnId) errors.push("Missing return ID");
    if (!orderReference) errors.push("Missing order reference");
    if (!shipmentReference) errors.push("Missing shipment reference");
    if (errors.length) return { returnId: returnId || "unknown", errors };
    return null;
  }

  validateReturnRecords(
    records: ReturnRecord[],
    config: ReturnManagementConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.returnId)) {
        errors.push(`Duplicate return record: ${record.returnId}`);
      }
      seen.add(record.returnId);
      if (!record.returnId.startsWith("rm-")) {
        errors.push(`Invalid return ID prefix: ${record.returnId}`);
      }
    }
    return { errors, warnings };
  }
}
