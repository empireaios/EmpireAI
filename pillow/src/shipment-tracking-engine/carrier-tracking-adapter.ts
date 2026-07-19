/** R2-12 — Carrier Tracking Adapter. */

import type { ShipmentRecord } from "../shipping-carrier-integration/types.js";
import type { SupportedCarrierIdentifier, TrackingStatus } from "./types.js";
import type { ShipmentTrackingEngineConfiguration } from "./configuration.js";
import { buildTrackingNumber, getFixtureTrackingStatus } from "./tracking-fixtures.js";

export type CarrierTrackingResponse = {
  success: boolean;
  trackingNumber: string;
  status: TrackingStatus;
  location: string | null;
  estimatedDeliveryDate: string | null;
  error: string | null;
};

export class CarrierTrackingAdapter {
  queryTracking(input: {
    shipment: ShipmentRecord;
    fixtureMode?: "in_transit" | "delivered" | "delayed" | "failed";
    config: ShipmentTrackingEngineConfiguration;
  }): CarrierTrackingResponse {
    if (!input.config.carrierTrackingRulesEnabled) {
      return {
        success: false,
        trackingNumber: "",
        status: "pending",
        location: null,
        estimatedDeliveryDate: null,
        error: "Carrier tracking rules disabled",
      };
    }

    const trackingNumber = buildTrackingNumber(input.shipment.carrierId, input.shipment.shipmentId);
    const mode = input.fixtureMode ?? "in_transit";
    const fixture = getFixtureTrackingStatus(mode);

    return {
      success: true,
      trackingNumber,
      status: fixture.status,
      location: fixture.location,
      estimatedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]!,
      error: null,
    };
  }

  supportsCarrier(carrierId: SupportedCarrierIdentifier): boolean {
    return ["usps", "ups", "fedex", "dhl"].includes(carrierId);
  }
}
