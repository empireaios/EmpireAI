/** R2-11 — Carrier API Client (structural — no live HTTP). */

import type { SupportedCarrierIdentifier } from "./types.js";
import type { ShippingCarrierIntegrationConfiguration } from "./configuration.js";
import { getCarrierRateTable } from "./carrier-fixtures.js";

export type CarrierApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  rateLimited: boolean;
};

export class CarrierApiClient {
  private requestCount = 0;

  createShipmentRequest(input: {
    carrierId: SupportedCarrierIdentifier;
    orderReference: string;
    fulfilmentReference: string;
    config: ShippingCarrierIntegrationConfiguration;
  }): CarrierApiResponse<{ shipmentRequestId: string }> {
    this.requestCount += 1;
    if (this.requestCount % 50 === 0) {
      return { success: false, data: null, error: "Rate limit exceeded", rateLimited: true };
    }
    return {
      success: true,
      data: {
        shipmentRequestId: `sci-req-${input.carrierId}-${Date.now()}`,
      },
      error: null,
      rateLimited: false,
    };
  }

  requestLabel(input: {
    carrierId: SupportedCarrierIdentifier;
    shipmentRequestId: string;
  }): CarrierApiResponse<{ labelReference: string }> {
    return {
      success: true,
      data: { labelReference: `sci-label-${input.carrierId}-${Date.now()}` },
      error: null,
      rateLimited: false,
    };
  }

  requestRates(carrierId: SupportedCarrierIdentifier): CarrierApiResponse<{
    rate: number;
    currency: string;
    estimatedDays: number;
  }> {
    const table = getCarrierRateTable()[carrierId];
    return {
      success: true,
      data: { rate: table.rate, currency: "USD", estimatedDays: table.days },
      error: null,
      rateLimited: false,
    };
  }

  confirmShipment(shipmentRequestId: string): CarrierApiResponse<{ confirmationId: string }> {
    return {
      success: true,
      data: { confirmationId: `sci-confirm-${shipmentRequestId}` },
      error: null,
      rateLimited: false,
    };
  }

  resetForTesting(): void {
    this.requestCount = 0;
  }
}
