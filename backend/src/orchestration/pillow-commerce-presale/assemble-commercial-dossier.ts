/**
 * Assemble Commercial Decision Dossier from live preflight inputs.
 * Shared by discovery cycle and re-evaluation — Pillow synthesis, not Cursor manufacture.
 */
import type { CjFreightOption } from "../../suppliers/cj-dropshipping/cj-types.js";
import {
  assessDeliveryPromise,
  buildCommercialDecisionDossier,
  classifyBrandRoute,
  type CommercialDecisionDossier,
  type CompetitiveOfferSnapshot,
  type DossierVerdict,
} from "./commercial-decision-dossier.js";
import {
  computePricePremiumPct,
  decideDossierVerdict,
  dossierVerdictAllowsApprovalSurface,
  toExecutiveRecommendationFlag,
} from "./decide-dossier-verdict.js";
import {
  DEFAULT_START_QUANTITY,
  type EvidenceFreshness,
  type MoneyEvidence,
} from "./models.js";

export {
  computePricePremiumPct,
  decideDossierVerdict,
  dossierVerdictAllowsApprovalSurface,
  toExecutiveRecommendationFlag,
} from "./decide-dossier-verdict.js";

export function parseFreightTransitDays(option: CjFreightOption | null | undefined): {
  min: number | null;
  max: number | null;
  warehouseHint: string | null;
} {
  if (!option) return { min: null, max: null, warehouseHint: null };
  if (
    typeof option.minDeliveryDays === "number" &&
    typeof option.maxDeliveryDays === "number"
  ) {
    return {
      min: option.minDeliveryDays,
      max: option.maxDeliveryDays,
      warehouseHint: option.countryCode ?? null,
    };
  }
  const aging = option.logisticAging ?? "";
  const range = aging.match(/(\d+)\s*[-~to]+\s*(\d+)/i);
  if (range) {
    return { min: Number(range[1]), max: Number(range[2]), warehouseHint: option.countryCode ?? null };
  }
  const single = aging.match(/(\d+)/);
  if (single) {
    const d = Number(single[1]);
    return { min: d, max: d + 2, warehouseHint: option.countryCode ?? null };
  }
  return { min: null, max: null, warehouseHint: option.countryCode ?? null };
}

export function pickCheapestFreight(options: CjFreightOption[]): {
  priceUsd: number | null;
  option: CjFreightOption | null;
} {
  let best: CjFreightOption | null = null;
  let bestPrice: number | null = null;
  for (const o of options) {
    const p = o.logisticPrice;
    if (typeof p !== "number" || !Number.isFinite(p)) continue;
    if (bestPrice === null || p < bestPrice) {
      bestPrice = p;
      best = o;
    }
  }
  return { priceUsd: bestPrice, option: best };
}

export function assembleCommercialDecisionDossier(input: {
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
  freightOption?: CjFreightOption | null;
  salesRank?: number | null;
  risks: string[];
  startingQuantity?: number;
}): {
  dossier: CommercialDecisionDossier;
  verdict: DossierVerdict;
  why: string;
  rejectCode?: string;
  confidence: "high" | "medium" | "low";
} {
  const transit = parseFreightTransitDays(input.freightOption);
  const delivery = assessDeliveryPromise({
    freightDaysMin: transit.min,
    freightDaysMax: transit.max,
    warehouseOrigin: transit.warehouseHint,
    amazonHandlingDays: 2,
  });
  const brand = classifyBrandRoute({
    brandName: input.brandName,
    productName: input.productName,
  });
  const pricePremiumPct = computePricePremiumPct(
    input.proposedSellingPriceUsd,
    input.competition.lowestCompetitorPriceUsd,
  );
  const decided = decideDossierVerdict({
    brandRoute: brand.route,
    deliveryCanMeet: delivery.supplierCanMeet,
    amazonEligibility: input.amazonEligibility,
    profitOk: input.expectedProfitUsd >= 1,
    pricePremiumPct,
    demandEvidencePresent: typeof input.salesRank === "number",
    competingOfferCount: input.competition.competingOfferCount,
  });

  const demandEvidence =
    typeof input.salesRank === "number"
      ? `Amazon catalog salesRank=${input.salesRank} [LIVE]. Demand not fabricated beyond this signal.`
      : "Sales rank UNKNOWN from authorized APIs. Existence on Amazon is not demand proof.";

  const risks = [...input.risks];
  if (delivery.supplierCanMeet !== "YES") {
    risks.push(`Delivery promise: supplierCanMeet=${delivery.supplierCanMeet}`);
  }
  if (brand.route !== "GENERIC_UNBRANDED") {
    risks.push(`Brand route ${brand.route} requires elevated scrutiny`);
  }
  if (input.competition.freshness !== "LIVE") {
    risks.push("Competing offer snapshot not LIVE — marketplace position partially UNKNOWN");
  }
  if (pricePremiumPct != null && pricePremiumPct >= 25) {
    risks.push(
      `Our proposed price is about ${pricePremiumPct.toFixed(0)}% above the lowest competing offer — material commercial risk.`,
    );
  }
  if (typeof input.salesRank !== "number") {
    risks.push("Demand evidence is not verified.");
  }
  if (decided.verdict !== "APPROVE" && decided.verdict !== "REJECT") {
    risks.push(
      `Pillow recommendation is ${decided.verdict} (confidence ${decided.confidence}) — not APPROVE until uncertainty clears.`,
    );
  }

  const dossier = buildCommercialDecisionDossier({
    ...input,
    demandEvidence,
    imagesAssessment:
      "OFFER_ON_EXISTING_ASIN — using Amazon catalog imagery; supplier image regeneration not required for first-dollar offer route.",
    copyAssessment:
      "Existing catalog copy controlled by Amazon PDP — seller offer fields only (price/quantity/condition). No SEO spam regeneration.",
    startingQuantity: input.startingQuantity ?? DEFAULT_START_QUANTITY,
    delivery,
    risks,
    pillowRecommendation: decided.verdict,
    why: decided.why,
  });

  return {
    dossier,
    verdict: decided.verdict,
    why: decided.why,
    rejectCode: decided.rejectCode,
    confidence: decided.confidence,
  };
}
