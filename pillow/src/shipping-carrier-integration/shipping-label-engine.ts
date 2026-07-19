/** R2-11 — Shipping Label Engine. */

import type { ShipmentRecord } from "./types.js";

export class ShippingLabelEngine {
  attachLabel(record: ShipmentRecord, labelReference: string): ShipmentRecord {
    return {
      ...record,
      shippingLabelReference: labelReference,
      shipmentStatus: "label_generated",
    };
  }

  confirmShipment(record: ShipmentRecord): ShipmentRecord {
    return {
      ...record,
      shipmentStatus: "confirmed",
    };
  }

  updateStatus(record: ShipmentRecord, status: ShipmentRecord["shipmentStatus"]): ShipmentRecord {
    return { ...record, shipmentStatus: status };
  }
}
