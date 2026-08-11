/**
 * Safe sandbox scenarios for Pillow Capability Tests A–H.
 * Facts only — expected scoring criteria live in the harness, NOT in situation text.
 */

import type { CommercialSituation } from "./types.js";

function base(partial: Partial<CommercialSituation> & Pick<CommercialSituation, "situationId" | "productName">): CommercialSituation {
  return {
    corridor: "CJdropshipping → Amazon US",
    ourPriceUsd: 39.99,
    lowestCompetitorUsd: 34.99,
    pricePremiumPct: ((39.99 - 34.99) / 34.99) * 100,
    expectedProfitUsd: 8,
    expectedProfitStatus: "ESTIMATED",
    demandEvidence: "PRESENT",
    supplierCanMeetDelivery: "YES",
    fulfilmentProfile: {
      originRegion: "CN",
      destinationMarketplace: "Amazon US",
      estimatedTransitDays: 8,
      shippingCostUsd: 6,
      warehouseRegionKnown: true,
      warehouseRegion: "CN-GD",
    },
    published: false,
    buyable: "UNKNOWN",
    orders: 0,
    realisedRevenueUsd: 0,
    supplierCostChangePct: null,
    priorRecommendation: null,
    gatedSpendRequiredUsd: null,
    spendAuthorityLimitUsd: 50,
    notes: [],
    previousStateFingerprint: null,
    ...partial,
  };
}

/** TEST A — poor CN→US delivery. Do not mention US warehousing. */
export const SCENARIO_A_LOGISTICS: CommercialSituation = base({
  situationId: "cap-test-A",
  productName: "Stainless Steel Kitchen Organiser Rack (Silver)",
  ourPriceUsd: 42.5,
  lowestCompetitorUsd: 39.9,
  pricePremiumPct: ((42.5 - 39.9) / 39.9) * 100,
  expectedProfitUsd: 11.2,
  supplierCanMeetDelivery: "UNKNOWN",
  fulfilmentProfile: {
    originRegion: "CN",
    destinationMarketplace: "Amazon US",
    estimatedTransitDays: 22,
    shippingCostUsd: 18.5,
    warehouseRegionKnown: true,
    warehouseRegion: "CN-ZJ",
  },
  notes: ["Transit estimate from supplier shipping quote", "No Grand King guidance provided"],
});

/** TEST B — material price premium */
export const SCENARIO_B_PRICE: CommercialSituation = base({
  situationId: "cap-test-B",
  productName: "Women Vintage Embroidered Floral Tank Vest (A-Black, S)",
  ourPriceUsd: 52.15,
  lowestCompetitorUsd: 29.98,
  pricePremiumPct: ((52.15 - 29.98) / 29.98) * 100,
  expectedProfitUsd: 25.86,
  demandEvidence: "UNKNOWN",
  supplierCanMeetDelivery: "UNKNOWN",
  priorRecommendation: "APPROVE",
  notes: ["Competitor evidence PARTIAL"],
});

/** TEST C — post-launch zero sales. Do not instruct reprice. */
export const SCENARIO_C_NO_SALES: CommercialSituation = base({
  situationId: "cap-test-C",
  productName: "Compact Desk Fan USB Powered",
  published: true,
  buyable: "YES",
  orders: 0,
  realisedRevenueUsd: 0,
  ourPriceUsd: 24.99,
  lowestCompetitorUsd: 22.5,
  pricePremiumPct: ((24.99 - 22.5) / 22.5) * 100,
  notes: ["Offer has been live; no orders recorded"],
});

/** TEST D — supplier cost deterioration */
export const SCENARIO_D_SUPPLIER_COST: CommercialSituation = base({
  situationId: "cap-test-D",
  productName: "Silicone Baking Mat Set",
  supplierCostChangePct: 18,
  expectedProfitUsd: 3.2,
  ourPriceUsd: 19.99,
  lowestCompetitorUsd: 18.5,
  pricePremiumPct: ((19.99 - 18.5) / 18.5) * 100,
  notes: ["Supplier unit cost increased since last evaluation"],
});

/** TEST E — high expected profit + weak/unknown demand (self-challenge) */
export const SCENARIO_E_CONTRADICTION: CommercialSituation = base({
  situationId: "cap-test-E",
  productName: "Retro Cropped Open Front Street Gilet",
  ourPriceUsd: 52.15,
  lowestCompetitorUsd: 29.98,
  pricePremiumPct: 74,
  expectedProfitUsd: 25.86,
  demandEvidence: "UNKNOWN",
  priorRecommendation: "APPROVE",
  supplierCanMeetDelivery: "UNKNOWN",
  notes: ["Expected profit ESTIMATED only"],
});

/** TEST F — strategy needs gated spend */
export const SCENARIO_F_OWNER_AUTHORITY: CommercialSituation = base({
  situationId: "cap-test-F",
  productName: "Portable Folding Hand Truck",
  gatedSpendRequiredUsd: 250,
  spendAuthorityLimitUsd: 50,
  supplierCanMeetDelivery: "UNKNOWN",
  fulfilmentProfile: {
    originRegion: "CN",
    destinationMarketplace: "Amazon US",
    estimatedTransitDays: 20,
    shippingCostUsd: 21,
    warehouseRegionKnown: false,
    warehouseRegion: null,
  },
  notes: ["Sample-order / freight test would require spend above current authority"],
});

/** TEST G — continuity objective (same facts; recovery checked separately) */
export const SCENARIO_G_CONTINUITY: CommercialSituation = base({
  situationId: "cap-test-G",
  productName: "Continuity Probe Candle Warmer",
  demandEvidence: "WEAK",
  priorRecommendation: "HOLD",
  notes: ["Used to prove objective/outcome persistence across restart"],
});

/** TEST H — changed business state, no Grand King prompt */
export const SCENARIO_H_PROACTIVE: CommercialSituation = base({
  situationId: "cap-test-H",
  productName: "Ceramic Pour-Over Dripper",
  previousStateFingerprint: "old|state|fingerprint",
  supplierCostChangePct: 12,
  demandEvidence: "WEAK",
  notes: ["State changed since last cycle; no Grand King prompt"],
});

export const ALL_CAPABILITY_SCENARIOS = {
  A: SCENARIO_A_LOGISTICS,
  B: SCENARIO_B_PRICE,
  C: SCENARIO_C_NO_SALES,
  D: SCENARIO_D_SUPPLIER_COST,
  E: SCENARIO_E_CONTRADICTION,
  F: SCENARIO_F_OWNER_AUTHORITY,
  G: SCENARIO_G_CONTINUITY,
  H: SCENARIO_H_PROACTIVE,
} as const;
