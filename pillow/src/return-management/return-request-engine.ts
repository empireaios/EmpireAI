/** R2-13 — Return Request Engine. */

import type { ShipmentTrackingRecord } from "../shipment-tracking-engine/types.js";
import { RM_METADATA_VERSION } from "./paths.js";
import {
  buildReturnId,
  DEFAULT_RETURN_REASON,
  resolveSupplierFromOrder,
} from "./return-fixtures.js";
import type {
  CreateReturnRequestInput,
  ReceiveCustomerReturnRequestInput,
  ReturnRecord,
  ReturnReason,
  SupportedSupplierIdentifier,
} from "./types.js";

export class ReturnRequestEngine {
  buildReturnRecord(input: {
    orderReference: string;
    shipmentReference: string;
    customerReference: string;
    supplierReference: SupportedSupplierIdentifier;
    returnReason: ReturnReason;
    trackingRecord?: ShipmentTrackingRecord | null;
  }): ReturnRecord {
    const returnId = buildReturnId(input.shipmentReference);
    return {
      returnId,
      timestamp: new Date().toISOString(),
      orderReference: input.orderReference,
      shipmentReference: input.shipmentReference,
      customerReference: input.customerReference,
      supplierReference: input.supplierReference,
      returnReason: input.returnReason,
      returnAuthorizationStatus: "pending",
      returnShipmentStatus: "pending",
      returnCompletionStatus: "pending",
      returnLabelReference: null,
      returnTrackingNumber: null,
      inventoryRestocked: false,
      validationStatus: "pending",
      metadataVersion: RM_METADATA_VERSION,
    };
  }

  fromCreateInput(
    input: CreateReturnRequestInput,
    trackingRecord: ShipmentTrackingRecord | null,
  ): ReturnRecord | null {
    if (input.includeFixtureReturn) {
      return this.buildReturnRecord({
        orderReference: input.orderReference ?? "ord-fixture-return",
        shipmentReference: input.shipmentReference ?? "sci-fixture-shipment",
        customerReference: input.customerReference ?? "cust-fixture-001",
        supplierReference: input.supplierReference ?? "cj",
        returnReason: input.returnReason ?? DEFAULT_RETURN_REASON,
      });
    }
    if (!trackingRecord) return null;
    return this.buildReturnRecord({
      orderReference: trackingRecord.orderReference,
      shipmentReference: trackingRecord.shipmentId,
      customerReference: input.customerReference ?? `cust-${trackingRecord.orderReference}`,
      supplierReference: input.supplierReference ?? resolveSupplierFromOrder(trackingRecord.orderReference),
      returnReason: input.returnReason ?? DEFAULT_RETURN_REASON,
      trackingRecord,
    });
  }

  fromCustomerRequest(
    input: ReceiveCustomerReturnRequestInput,
    trackingRecord: ShipmentTrackingRecord | null,
  ): ReturnRecord | null {
    if (!trackingRecord && !input.shipmentReference) return null;
    const shipmentRef = input.shipmentReference ?? trackingRecord!.shipmentId;
    const orderRef = trackingRecord?.orderReference ?? input.orderReference;
    return this.buildReturnRecord({
      orderReference: orderRef,
      shipmentReference: shipmentRef,
      customerReference: input.customerReference,
      supplierReference: resolveSupplierFromOrder(orderRef),
      returnReason: input.returnReason,
      trackingRecord,
    });
  }
}
