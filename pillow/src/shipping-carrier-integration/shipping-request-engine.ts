/** R2-11 — Shipping Request Engine. */

import type { FulfilmentRecord } from "../fulfilment-orchestrator/types.js";
import { SCI_METADATA_VERSION } from "./paths.js";
import { CARRIER_NAMES } from "./carrier-fixtures.js";
import type { ShipmentRecord, SupportedCarrierIdentifier } from "./types.js";

export class ShippingRequestEngine {
  buildShipmentRecord(input: {
    carrierId: SupportedCarrierIdentifier;
    orderReference: string;
    fulfilmentReference: string;
    shipmentRequestId: string;
    fulfilment?: FulfilmentRecord | null;
  }): ShipmentRecord {
    return {
      shipmentId: `sci-${input.carrierId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      carrierId: input.carrierId,
      carrierName: CARRIER_NAMES[input.carrierId],
      orderReference: input.orderReference,
      fulfilmentReference: input.fulfilmentReference,
      shipmentRequestId: input.shipmentRequestId,
      shippingLabelReference: null,
      shipmentStatus: "requested",
      validationStatus: "pending",
      metadataVersion: SCI_METADATA_VERSION,
    };
  }

  mapFulfilmentToCarrier(fulfilment: FulfilmentRecord): SupportedCarrierIdentifier {
    if (fulfilment.selectedFulfilmentRoute === "dropship_express") return "fedex";
    if (fulfilment.selectedFulfilmentRoute === "warehouse_dispatch") return "dhl";
    if (fulfilment.selectedFulfilmentRoute === "standard_fulfilment") return "ups";
    return "usps";
  }
}
