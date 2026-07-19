/** R2-17 — Carrier Selection Engine. */

import type { CarrierRegistration, ShippingRateQuote } from "../shipping-carrier-integration/types.js";
import type { LogisticsOptimizationConfiguration } from "./configuration.js";
import type { SupportedCarrierIdentifier } from "./types.js";
import { SUPPORTED_CARRIER_IDENTIFIERS } from "./paths.js";

const CARRIER_BASE_RATES: Record<SupportedCarrierIdentifier, { rate: number; days: number }> = {
  usps: { rate: 8.5, days: 5 },
  ups: { rate: 11.25, days: 3 },
  fedex: { rate: 14.75, days: 2 },
  dhl: { rate: 16.5, days: 4 },
};

export class CarrierSelectionEngine {
  selectCarrier(
    carriers: CarrierRegistration[],
    quotes: ShippingRateQuote[],
    config: LogisticsOptimizationConfiguration,
    preferSpeed = false,
  ): { carrierId: SupportedCarrierIdentifier; rate: number; days: number } {
    if (!config.carrierSelectionRulesEnabled || !carriers.length) {
      const fallback = SUPPORTED_CARRIER_IDENTIFIERS[0]!;
      const base = CARRIER_BASE_RATES[fallback];
      return { carrierId: fallback, rate: base.rate, days: base.days };
    }

    const active = carriers.filter((c) => c.authenticated).map((c) => c.carrierId);
    type CarrierCandidate = { carrierId: SupportedCarrierIdentifier; rate: number; days: number };
    const candidates: CarrierCandidate[] = quotes.length
      ? quotes
          .filter((q) => active.includes(q.carrierId))
          .map((q) => ({
            carrierId: q.carrierId,
            rate: q.rate,
            days: q.estimatedDays,
          }))
      : active.map((id) => ({
          carrierId: id,
          rate: CARRIER_BASE_RATES[id].rate,
          days: CARRIER_BASE_RATES[id].days,
        }));

    if (!candidates.length) {
      const fallback = active[0] ?? SUPPORTED_CARRIER_IDENTIFIERS[0]!;
      const base = CARRIER_BASE_RATES[fallback];
      return { carrierId: fallback, rate: base.rate, days: base.days };
    }

    const sorted = [...candidates].sort((a, b) => {
      if (preferSpeed) return a.days - b.days || a.rate - b.rate;
      const scoreA = a.rate + a.days * 2;
      const scoreB = b.rate + b.days * 2;
      return scoreA - scoreB;
    });

    const best = sorted[0]!;
    return { carrierId: best.carrierId, rate: best.rate, days: best.days };
  }

  estimateCarrierFailure(carrierId: SupportedCarrierIdentifier, carriers: CarrierRegistration[]): boolean {
    const carrier = carriers.find((c) => c.carrierId === carrierId);
    return !carrier || !carrier.authenticated;
  }
}
