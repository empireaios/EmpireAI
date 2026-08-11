/**
 * Logistics / fulfilment as a first-class optimisable strategic variable.
 *
 * IMPORTANT: Does NOT hard-code "Always choose CJ US warehouse."
 * Generates investigation alternatives from delivery economics/speed facts.
 */

import type { CommercialSituation } from "./types.js";

export type LogisticsAlternative = {
  id: string;
  label: string;
  rationale: string;
  requiresLiveConnector: boolean;
  abandonsCandidate: boolean;
};

export type LogisticsInvestigationResult = {
  triggered: boolean;
  reason: string;
  currentRouteSummary: string;
  alternatives: LogisticsAlternative[];
  recommendedNextInvestigation: string;
  hardCodedUsWarehouse: false;
};

export function investigateLogisticsAlternatives(
  situation: CommercialSituation,
): LogisticsInvestigationResult {
  const f = situation.fulfilmentProfile;
  const transit = f.estimatedTransitDays;
  const shipping = f.shippingCostUsd;
  const deliveryBad =
    situation.supplierCanMeetDelivery === "NO" ||
    (transit != null && transit >= 12) ||
    (shipping != null &&
      situation.ourPriceUsd != null &&
      shipping >= situation.ourPriceUsd * 0.35);

  const currentRouteSummary = [
    `corridor=${situation.corridor}`,
    `origin=${f.originRegion}`,
    `destination=${f.destinationMarketplace}`,
    `transitDays=${transit ?? "UNKNOWN"}`,
    `shippingUsd=${shipping ?? "UNKNOWN"}`,
    `warehouseRegion=${f.warehouseRegionKnown ? f.warehouseRegion : "UNKNOWN"}`,
    `supplierCanMeet=${situation.supplierCanMeetDelivery}`,
  ].join("; ");

  if (!deliveryBad) {
    return {
      triggered: false,
      reason: "No material logistics weakness detected from available facts",
      currentRouteSummary,
      alternatives: [],
      recommendedNextInvestigation: "Continue monitoring delivery promise vs realised transit",
      hardCodedUsWarehouse: false,
    };
  }

  const alternatives: LogisticsAlternative[] = [
    {
      id: "alt_warehouse_same_supplier",
      label: "Investigate alternate warehouse regions from the same supplier network",
      rationale:
        "Same SKU may be stockable from a closer warehouse; compare cost/transit without preferring any fixed region.",
      requiresLiveConnector: true,
      abandonsCandidate: false,
    },
    {
      id: "alt_domestic_substitute",
      label: "Investigate equivalent/substitute product stocked closer to the destination marketplace",
      rationale: "Domestic or near-market stock can repair delivery competitiveness when cross-border transit is weak.",
      requiresLiveConnector: true,
      abandonsCandidate: false,
    },
    {
      id: "alt_shipping_method",
      label: "Investigate alternate shipping methods on the current corridor",
      rationale: "Method changes may improve transit or cost without changing supplier.",
      requiresLiveConnector: true,
      abandonsCandidate: false,
    },
    {
      id: "alt_supplier",
      label: "Investigate an alternate supplier with stronger delivery economics",
      rationale: "Supplier concentration or weak CN→destination economics may be solvable by re-sourcing.",
      requiresLiveConnector: true,
      abandonsCandidate: false,
    },
    {
      id: "alt_marketplace_route",
      label: "Investigate an alternate marketplace route if destination delivery stays weak",
      rationale: "Corridor fitness is strategic; a weak route may justify marketplace/corridor change.",
      requiresLiveConnector: true,
      abandonsCandidate: false,
    },
    {
      id: "alt_price_margin",
      label: "Investigate altered price/margin strategy to absorb logistics reality",
      rationale: "If logistics cannot improve, economics may still be repaired — or prove unviable.",
      requiresLiveConnector: false,
      abandonsCandidate: false,
    },
    {
      id: "alt_abandon",
      label: "Consider abandoning the candidate if logistics make it commercially weak",
      rationale: "Logistics is optimisable; if no viable route exists, do not force the opportunity.",
      requiresLiveConnector: false,
      abandonsCandidate: true,
    },
  ];

  return {
    triggered: true,
    reason:
      transit != null && transit >= 12
        ? `Cross-border transit estimated at ${transit} days — investigate optimisable fulfilment variables`
        : situation.supplierCanMeetDelivery === "NO"
          ? "Supplier cannot meet delivery promise — investigate alternatives"
          : "Shipping cost share of price is material — investigate alternatives",
    currentRouteSummary,
    alternatives,
    recommendedNextInvestigation: alternatives[0]!.label,
    hardCodedUsWarehouse: false,
  };
}
