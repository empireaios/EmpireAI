/**
 * Complete Commercial Decision Dossier — mandatory before Grand King approval.
 * UNKNOWN remains UNKNOWN. Never fabricate Featured Offer, demand, or delivery certainty.
 */
import type { EvidenceFreshness, MoneyEvidence } from "./models.js";
import { formatMoneyEvidence } from "./models.js";

export type BrandRoute = "EXISTING_BRANDED_CATALOG" | "GENERIC_UNBRANDED" | "OWN_BRAND_PRIVATE_LABEL";
export type ListingRoute = "OFFER_ON_EXISTING_ASIN" | "CREATE_NEW_ASIN";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type DossierVerdict = "APPROVE" | "REJECT";

export type CompetitiveOfferSnapshot = {
  competingOfferCount: number | null;
  lowestCompetitorPriceUsd: number | null;
  featuredOfferPriceUsd: number | null;
  featuredOfferSellerId: string | null;
  featuredOfferEligible: "YES" | "NO" | "UNKNOWN";
  currentlyFeaturedOffer: "YES" | "NO" | "UNKNOWN";
  relativeOfferPosition: string;
  freshness: EvidenceFreshness;
  source: string;
  note?: string;
};

export type DeliveryPromiseAssessment = {
  cjProcessingDaysMin: number | null;
  cjProcessingDaysMax: number | null;
  carrierTransitDaysMin: number | null;
  carrierTransitDaysMax: number | null;
  earliestExpectedDeliveryDays: number | null;
  latestExpectedDeliveryDays: number | null;
  amazonHandlingTimeDays: number | null;
  amazonBuyerPromiseDaysMin: number | null;
  amazonBuyerPromiseDaysMax: number | null;
  trackingAvailable: boolean | null;
  warehouseOrigin: string | null;
  safetyBufferDays: number;
  lateDeliveryRisk: RiskLevel;
  customerExpectation: string;
  supplierCanMeet: "YES" | "NO" | "UNKNOWN";
  freshness: EvidenceFreshness;
  source: string;
};

export type PricingSensitivity = {
  breakEvenPriceUsd: number;
  priceBufferUsd: number;
  ifCjCostUp10PctStillProfitable: boolean;
  ifFreightUp20PctStillProfitable: boolean;
  ifMarketPriceDown10PctStillProfitable: boolean;
  rationale: string;
};

export type CommercialDecisionDossier = {
  dossierVersion: "FD-CDD-001";
  computedAt: string;
  /** A */ productIdentity: {
    productName: string;
    marketplaceId: string;
    asin: string;
    amazonSellerSku: string;
    cjPid: string;
    cjVid: string;
    cjVariantSku: string;
    mappingTimestamp: string;
  };
  /** B–E */ supplier: {
    status: string;
    stockUnits: number | null;
    stockFreshness: EvidenceFreshness;
    productCost: MoneyEvidence;
    usShipping: MoneyEvidence;
    warehouseOrigin: string | null;
    processingDays: string;
    trackingSupport: string;
  };
  /** F–H */ eligibilityAndBrand: {
    amazonEligibility: "PASS" | "FAIL" | "UNKNOWN";
    restrictionStatus: string;
    brandName: string | null;
    brandRoute: BrandRoute;
    brandRouteRationale: string;
    ipCompliance: string;
    customerReceives: string;
    brandAppearsWhere: string;
  };
  /** I–L */ presentation: {
    listingRoute: ListingRoute;
    imagesAssessment: string;
    copyAssessment: string;
  };
  /** M–P */ marketplaceCompetition: CompetitiveOfferSnapshot;
  /** Q–V */ economics: {
    amazonFees: MoneyEvidence;
    proposedSellingPriceUsd: number;
    pricingRationale: string;
    expectedProfitUsd: number;
    expectedMarginPct: number;
    sensitivity: PricingSensitivity;
  };
  /** W–Z */ demandFulfilmentRisk: {
    demandEvidence: string;
    fulfilmentFeasibility: string;
    delivery: DeliveryPromiseAssessment;
    riskLevel: RiskLevel;
    riskReasons: string[];
  };
  /** AA–AB */ exposureAndAction: {
    startingQuantity: number;
    pillowRecommendation: DossierVerdict;
    why: string;
    exactActionAfterApproval: string;
  };
  unknownFields: string[];
  grandKingSummary: string;
};

export function assessDeliveryPromise(input: {
  freightDaysMin?: number | null;
  freightDaysMax?: number | null;
  processingDaysMin?: number | null;
  processingDaysMax?: number | null;
  warehouseOrigin?: string | null;
  amazonHandlingDays?: number | null;
  /**
   * If Amazon listing would show a shorter promise than supplier reality
   * (e.g. buyer sees 3–5 while CJ needs 10–15), pass that buyer window here.
   * When omitted, buyer promise is aligned to realistic supplier transit (honest MF config).
   */
  amazonBuyerPromiseDaysMin?: number | null;
  amazonBuyerPromiseDaysMax?: number | null;
}): DeliveryPromiseAssessment {
  const procMin = input.processingDaysMin ?? 1;
  const procMax = input.processingDaysMax ?? 3;
  const transitMin = input.freightDaysMin ?? 5;
  const transitMax = input.freightDaysMax ?? 12;
  const safetyBufferDays = 2;
  const earliest = procMin + transitMin;
  const latest = procMax + transitMax + safetyBufferDays;
  const handling = input.amazonHandlingDays ?? 2;
  // Honest MF buyer window = handling + realistic transit (must not silently promise 3–5 for CN→US).
  const alignedBuyerMin = handling + transitMin;
  const alignedBuyerMax = handling + transitMax + safetyBufferDays;
  const buyerMin = input.amazonBuyerPromiseDaysMin ?? alignedBuyerMin;
  const buyerMax = input.amazonBuyerPromiseDaysMax ?? alignedBuyerMax;
  const canMeet: "YES" | "NO" | "UNKNOWN" =
    latest <= buyerMax
      ? "YES"
      : latest <= buyerMax + 3
        ? "UNKNOWN"
        : "NO";
  // Short Amazon promise vs long CJ transit is an explicit mismatch class.
  const shortPromiseMismatch =
    buyerMax < earliest || (transitMax >= 10 && buyerMax <= 7);
  const lateRisk: RiskLevel =
    canMeet === "NO" || shortPromiseMismatch
      ? "HIGH"
      : latest >= 14 || canMeet === "UNKNOWN"
        ? "MEDIUM"
        : "LOW";
  const finalCanMeet = shortPromiseMismatch && canMeet !== "NO" ? "NO" : canMeet;

  return {
    cjProcessingDaysMin: procMin,
    cjProcessingDaysMax: procMax,
    carrierTransitDaysMin: transitMin,
    carrierTransitDaysMax: transitMax,
    earliestExpectedDeliveryDays: earliest,
    latestExpectedDeliveryDays: latest,
    amazonHandlingTimeDays: handling,
    amazonBuyerPromiseDaysMin: buyerMin,
    amazonBuyerPromiseDaysMax: buyerMax,
    trackingAvailable: true,
    warehouseOrigin: input.warehouseOrigin ?? null,
    safetyBufferDays,
    lateDeliveryRisk: lateRisk,
    customerExpectation: shortPromiseMismatch
      ? `MISMATCH RISK: Amazon buyer promise ~${buyerMin}–${buyerMax} days vs supplier realistic ${earliest}–${latest} days (CJ transit ${transitMin}–${transitMax}d).`
      : `Buyer-facing delivery estimate ~${buyerMin}–${buyerMax} days (merchant-fulfilled handling ${handling}d + transit ${transitMin}–${transitMax}d + buffer). Honest MF config required — do not promise 3–5 days for CN→US freight.`,
    supplierCanMeet: finalCanMeet,
    freshness: "ESTIMATED",
    source: "cj.freight + conservative MF handling model",
  };
}

export function classifyBrandRoute(input: {
  brandName?: string | null;
  productName?: string | null;
}): { route: BrandRoute; rationale: string; customerReceives: string; brandAppearsWhere: string } {
  const brand = (input.brandName ?? "").trim();
  if (!brand || /^(generic|unbranded|no brand|n\/a|unknown)$/i.test(brand) || /\bgeneric\b/i.test(brand)) {
    return {
      route: "GENERIC_UNBRANDED",
      rationale: "Catalog brand absent or generic — treat as unbranded/generic offer route.",
      customerReceives: "Supplier-fulfilled product matching the Amazon catalog listing attributes.",
      brandAppearsWhere: "No EmpireAI private-label branding applied on product/packaging for this route.",
    };
  }
  if (/empire|pillow|our brand/i.test(brand)) {
    return {
      route: "OWN_BRAND_PRIVATE_LABEL",
      rationale: "Brand field indicates owned/private-label intent — requires explicit branding fulfilment config before sale.",
      customerReceives: "Product under our brand only if CJ branding configuration is verified before publication.",
      brandAppearsWhere: "UNKNOWN until private-label packaging/label configuration is verified with CJ.",
    };
  }
  return {
    route: "EXISTING_BRANDED_CATALOG",
    rationale: `Joining existing catalog brand "${brand}" — must be authentic same product; do not substitute generic lookalikes.`,
    customerReceives: `Catalog product associated with brand "${brand}" as listed on Amazon.`,
    brandAppearsWhere: `Amazon catalog brand: ${brand}. EmpireAI must not overlay unauthorized branding.`,
  };
}

export function buildPricingSensitivity(input: {
  price: number;
  cost: number;
  shipping: number;
  fees: number;
}): PricingSensitivity {
  const direct = input.cost + input.shipping + input.fees;
  const breakEven = Number(direct.toFixed(2));
  const buffer = Number((input.price - breakEven).toFixed(2));
  const profit = input.price - direct;
  const costUp = input.cost * 1.1 + input.shipping + input.fees;
  const freightUp = input.cost + input.shipping * 1.2 + input.fees;
  const priceDown = input.price * 0.9;
  return {
    breakEvenPriceUsd: breakEven,
    priceBufferUsd: buffer,
    ifCjCostUp10PctStillProfitable: priceDown > 0 ? input.price - costUp > 0 : profit > 0 && input.price - costUp > 0,
    ifFreightUp20PctStillProfitable: input.price - freightUp > 0,
    ifMarketPriceDown10PctStillProfitable: priceDown - direct > 0,
    rationale: `Price $${input.price.toFixed(2)} covers landed CJ cost+ship $${(input.cost + input.shipping).toFixed(2)} + Amazon fees $${input.fees.toFixed(2)} with $${buffer.toFixed(2)} buffer above break-even $${breakEven.toFixed(2)}.`,
  };
}

export function buildCommercialDecisionDossier(input: {
  productName: string;
  marketplaceId: string;
  asin: string;
  amazonSellerSku: string;
  cjPid: string;
  cjVid: string;
  cjVariantSku: string;
  mappingTimestamp: string;
  stockUnits: number;
  stockFreshness: EvidenceFreshness;
  productCost: MoneyEvidence;
  usShipping: MoneyEvidence;
  amazonFees: MoneyEvidence;
  proposedSellingPriceUsd: number;
  expectedProfitUsd: number;
  expectedMarginPct: number;
  brandName?: string | null;
  amazonEligibility: "PASS" | "FAIL" | "UNKNOWN";
  restrictionStatus: string;
  competition: CompetitiveOfferSnapshot;
  delivery: DeliveryPromiseAssessment;
  demandEvidence: string;
  imagesAssessment: string;
  copyAssessment: string;
  startingQuantity: number;
  risks: string[];
  pillowRecommendation: DossierVerdict;
  why: string;
}): CommercialDecisionDossier {
  const brand = classifyBrandRoute({
    brandName: input.brandName,
    productName: input.productName,
  });
  const cost = input.productCost.amountUsd ?? 0;
  const ship = input.usShipping.amountUsd ?? 0;
  const fees = input.amazonFees.amountUsd ?? 0;
  const sensitivity = buildPricingSensitivity({
    price: input.proposedSellingPriceUsd,
    cost,
    shipping: ship,
    fees,
  });

  const unknownFields: string[] = [];
  if (input.competition.competingOfferCount == null) unknownFields.push("competingOfferCount");
  if (input.competition.lowestCompetitorPriceUsd == null) unknownFields.push("lowestCompetitorPrice");
  if (input.competition.featuredOfferEligible === "UNKNOWN") unknownFields.push("featuredOfferEligible");
  if (input.delivery.supplierCanMeet === "UNKNOWN") unknownFields.push("supplierCanMeetDelivery");
  if (!input.brandName) unknownFields.push("brandName");
  if (/UNKNOWN/i.test(input.demandEvidence)) unknownFields.push("demandEvidence");

  const riskLevel: RiskLevel =
    input.delivery.lateDeliveryRisk === "HIGH" || input.pillowRecommendation === "REJECT"
      ? "HIGH"
      : input.risks.length >= 3 || input.delivery.lateDeliveryRisk === "MEDIUM"
        ? "MEDIUM"
        : "LOW";

  const dossier: CommercialDecisionDossier = {
    dossierVersion: "FD-CDD-001",
    computedAt: new Date().toISOString(),
    productIdentity: {
      productName: input.productName,
      marketplaceId: input.marketplaceId,
      asin: input.asin,
      amazonSellerSku: input.amazonSellerSku,
      cjPid: input.cjPid,
      cjVid: input.cjVid,
      cjVariantSku: input.cjVariantSku,
      mappingTimestamp: input.mappingTimestamp,
    },
    supplier: {
      status: "CJ live product/variant queried",
      stockUnits: input.stockUnits,
      stockFreshness: input.stockFreshness,
      productCost: input.productCost,
      usShipping: input.usShipping,
      warehouseOrigin: input.delivery.warehouseOrigin,
      processingDays: `${input.delivery.cjProcessingDaysMin}–${input.delivery.cjProcessingDaysMax} days [ESTIMATED]`,
      trackingSupport: input.delivery.trackingAvailable ? "Tracking supported via CJ logistic/trackInfo" : "UNKNOWN",
    },
    eligibilityAndBrand: {
      amazonEligibility: input.amazonEligibility,
      restrictionStatus: input.restrictionStatus,
      brandName: input.brandName ?? null,
      brandRoute: brand.route,
      brandRouteRationale: brand.rationale,
      ipCompliance:
        brand.route === "EXISTING_BRANDED_CATALOG"
          ? "Must sell authentic catalog product; generic substitutes forbidden."
          : brand.route === "OWN_BRAND_PRIVATE_LABEL"
            ? "Private-label IP/packaging must be verified before sale."
            : "Generic/unbranded route — avoid unauthorized brand claims.",
      customerReceives: brand.customerReceives,
      brandAppearsWhere: brand.brandAppearsWhere,
    },
    presentation: {
      listingRoute: "OFFER_ON_EXISTING_ASIN",
      imagesAssessment: input.imagesAssessment,
      copyAssessment: input.copyAssessment,
    },
    marketplaceCompetition: input.competition,
    economics: {
      amazonFees: input.amazonFees,
      proposedSellingPriceUsd: input.proposedSellingPriceUsd,
      pricingRationale: sensitivity.rationale,
      expectedProfitUsd: input.expectedProfitUsd,
      expectedMarginPct: input.expectedMarginPct,
      sensitivity,
    },
    demandFulfilmentRisk: {
      demandEvidence: input.demandEvidence,
      fulfilmentFeasibility:
        input.delivery.supplierCanMeet === "NO"
          ? "FAIL — supplier delivery cannot meet Amazon buyer promise under current estimates"
          : "CJ US freight path available; low start quantity; mapping deterministic",
      delivery: input.delivery,
      riskLevel,
      riskReasons: input.risks,
    },
    exposureAndAction: {
      startingQuantity: input.startingQuantity,
      pillowRecommendation: input.pillowRecommendation,
      why: input.why,
      exactActionAfterApproval:
        "1) Revalidate stock/cost/freight/fees/restrictions. 2) Publish LISTING_OFFER_ONLY with Amazon↔CJ map. 3) Verify BUYABLE (ACCEPTED≠BUYABLE). 4) Monitor offer. 5) On real Amazon order: idempotent EmpireAI→CJ createOrder (approval-gated spend). 6) Sync tracking. 7) confirmShipment to Amazon. 8) Record actual P&L ≠ expected. 9) Capture institutional memory.",
    },
    unknownFields,
    grandKingSummary: "",
  };

  dossier.grandKingSummary = renderGrandKingDossierSummary(dossier);
  return dossier;
}

export function renderGrandKingDossierSummary(d: CommercialDecisionDossier): string {
  const c = d.marketplaceCompetition;
  const e = d.economics;
  const del = d.demandFulfilmentRisk.delivery;
  return [
    "COMMERCE OPPORTUNITY — GRAND KING DECISION",
    "",
    `Product: ${d.productIdentity.productName}`,
    `Route: ${d.eligibilityAndBrand.brandRoute.replace(/_/g, " ")}`,
    `Amazon ASIN: ${d.productIdentity.asin}`,
    `CJ Product/Variant: ${d.productIdentity.cjPid} / ${d.productIdentity.cjVid}`,
    `Amazon seller SKU: ${d.productIdentity.amazonSellerSku}`,
    `Brand: ${d.eligibilityAndBrand.brandName ?? "UNKNOWN"}`,
    `Brand route: ${d.eligibilityAndBrand.brandRoute}`,
    `Amazon eligibility: ${d.eligibilityAndBrand.amazonEligibility}`,
    `Restriction status: ${d.eligibilityAndBrand.restrictionStatus}`,
    `CJ stock: ${d.supplier.stockUnits ?? "UNKNOWN"} [${d.supplier.stockFreshness}]`,
    `CJ product cost: ${formatMoneyEvidence(d.supplier.productCost)}`,
    `CJ processing: ${d.supplier.processingDays}`,
    `US shipping: ${formatMoneyEvidence(d.supplier.usShipping)}`,
    `Transit: ${del.carrierTransitDaysMin}–${del.carrierTransitDaysMax} days [${del.freshness}]`,
    `Expected Amazon buyer delivery: ${del.customerExpectation}`,
    `Supplier can meet promise: ${del.supplierCanMeet}`,
    `Amazon fees: ${formatMoneyEvidence(e.amazonFees)}`,
    `Competing offers: ${c.competingOfferCount ?? "UNKNOWN"} [${c.freshness}]`,
    `Lowest competing price: ${c.lowestCompetitorPriceUsd != null ? `$${c.lowestCompetitorPriceUsd.toFixed(2)}` : "UNKNOWN"}`,
    `Featured Offer eligible: ${c.featuredOfferEligible}`,
    `Currently Featured Offer: ${c.currentlyFeaturedOffer}`,
    `Our expected offer position: ${c.relativeOfferPosition}`,
    `Proposed price: $${e.proposedSellingPriceUsd.toFixed(2)}`,
    `Break-even: $${e.sensitivity.breakEvenPriceUsd.toFixed(2)}`,
    `Expected profit: $${e.expectedProfitUsd.toFixed(2)} (EXPECTED — not realised)`,
    `Expected margin: ${e.expectedMarginPct.toFixed(2)}%`,
    `Pricing rationale: ${e.pricingRationale}`,
    `Images/presentation: ${d.presentation.imagesAssessment}`,
    `Listing copy: ${d.presentation.copyAssessment}`,
    `Listing route: ${d.presentation.listingRoute}`,
    `Demand evidence: ${d.demandFulfilmentRisk.demandEvidence}`,
    `Risk: ${d.demandFulfilmentRisk.riskLevel} — ${d.demandFulfilmentRisk.riskReasons.join("; ") || "none"}`,
    `Starting exposure: ${d.exposureAndAction.startingQuantity} units`,
    `Pillow recommendation: ${d.exposureAndAction.pillowRecommendation}`,
    `Why: ${d.exposureAndAction.why}`,
    `After approval: ${d.exposureAndAction.exactActionAfterApproval}`,
    "",
    `UNKNOWN fields: ${d.unknownFields.length ? d.unknownFields.join(", ") : "none disclosed"}`,
    "Customer receives: " + d.eligibilityAndBrand.customerReceives,
    "Brand appears: " + d.eligibilityAndBrand.brandAppearsWhere,
  ].join("\n");
}
