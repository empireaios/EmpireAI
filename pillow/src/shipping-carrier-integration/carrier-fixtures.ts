/** R2-11 — Carrier fixtures (structural — no live HTTP). */

import type { SupportedCarrierIdentifier } from "./types.js";

export const CARRIER_NAMES: Record<SupportedCarrierIdentifier, string> = {
  usps: "United States Postal Service",
  ups: "United Parcel Service",
  fedex: "FedEx",
  dhl: "DHL Express",
};

export function getDefaultCarrierId(): SupportedCarrierIdentifier {
  return "usps";
}

export function getFixtureShipmentInput() {
  return {
    carrierId: "usps" as const,
    orderReference: "ord-ship-1001",
    fulfilmentReference: "fo-fixture-ref",
  };
}

export function getCarrierRateTable(): Record<SupportedCarrierIdentifier, { rate: number; days: number }> {
  return {
    usps: { rate: 8.5, days: 5 },
    ups: { rate: 12.75, days: 3 },
    fedex: { rate: 14.2, days: 2 },
    dhl: { rate: 18.9, days: 4 },
  };
}
