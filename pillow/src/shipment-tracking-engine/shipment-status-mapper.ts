/** R2-12 — Shipment Status Mapper. */

import type { DeliveryMilestone, ShipmentTrackingRecord, TrackingStatus } from "./types.js";
import { STE_METADATA_VERSION } from "./paths.js";
import type { ShipmentRecord } from "../shipping-carrier-integration/types.js";
import { buildTrackingNumber, estimateDeliveryDate } from "./tracking-fixtures.js";

export class ShipmentStatusMapper {
  mapToTrackingRecord(input: {
    shipment: ShipmentRecord;
    trackingNumber: string;
    status: TrackingStatus;
    location: string | null;
    milestone: DeliveryMilestone;
    delayStatus: ShipmentTrackingRecord["delayStatus"];
    estimatedDeliveryDate: string | null;
    deliveredTimestamp: string | null;
  }): ShipmentTrackingRecord {
    return {
      trackingRecordId: `ste-${input.shipment.shipmentId.replace("sci-", "")}`,
      timestamp: new Date().toISOString(),
      shipmentId: input.shipment.shipmentId,
      carrierId: input.shipment.carrierId,
      trackingNumber: input.trackingNumber || buildTrackingNumber(input.shipment.carrierId, input.shipment.shipmentId),
      orderReference: input.shipment.orderReference,
      fulfilmentReference: input.shipment.fulfilmentReference,
      currentShipmentStatus: input.status,
      currentLocation: input.location,
      deliveryMilestone: input.milestone,
      estimatedDeliveryDate: input.estimatedDeliveryDate ?? estimateDeliveryDate(5),
      deliveredTimestamp: input.deliveredTimestamp,
      delayStatus: input.delayStatus,
      validationStatus: "pending",
      metadataVersion: STE_METADATA_VERSION,
    };
  }

  statusToMilestone(status: TrackingStatus): DeliveryMilestone {
    if (status === "delivered") return "delivered";
    if (status === "out_for_delivery") return "out_for_delivery";
    if (status === "in_transit" || status === "delayed") return "in_transit";
    if (status === "picked_up") return "picked_up";
    return "label_created";
  }
}
