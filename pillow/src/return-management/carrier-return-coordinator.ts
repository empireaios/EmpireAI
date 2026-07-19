/** R2-13 — Carrier Return Coordinator. */

import { appendRmLog } from "./rm-logging.js";
import type { ReturnManagementConfiguration } from "./configuration.js";
import type { ReturnRecord } from "./types.js";
import { buildReturnTrackingNumber } from "./return-fixtures.js";

export type CarrierReturnResult = {
  success: boolean;
  returnShipmentStatus: ReturnRecord["returnShipmentStatus"];
  returnTrackingNumber: string | null;
  error: string | null;
};

export class CarrierReturnCoordinator {
  coordinateCarrierReturn(
    record: ReturnRecord,
    config: ReturnManagementConfiguration,
    fixtureMode?: "in_transit" | "received" | "failed",
  ): CarrierReturnResult {
    if (!config.carrierReturnRulesEnabled) {
      return {
        success: false,
        returnShipmentStatus: "failed",
        returnTrackingNumber: null,
        error: "Carrier return rules disabled",
      };
    }

    const trackingNumber = buildReturnTrackingNumber(record.returnId);
    const status =
      fixtureMode === "received"
        ? "received"
        : fixtureMode === "failed"
          ? "failed"
          : fixtureMode === "in_transit"
            ? "in_transit"
            : "label_generated";

    appendRmLog({
      event: "return_shipment_creation",
      level: "info",
      details: `Carrier return shipment ${status} for ${record.returnId}`,
    });

    return {
      success: true,
      returnShipmentStatus: status,
      returnTrackingNumber: trackingNumber,
      error: null,
    };
  }
}
