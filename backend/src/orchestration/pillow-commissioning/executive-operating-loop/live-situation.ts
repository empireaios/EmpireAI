/**
 * Build a live CommercialSituation from commissioning / commerce state.
 * UNKNOWN remains UNKNOWN — no invented demand/sales/competitor facts.
 */

import { getPillowCommercePresaleRepository } from "../../pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
import { buildSmartViableKpiSnapshot } from "../../pillow-commerce-presale/smart-viable-kpi.js";
import { getOneProductCommissioningRecord } from "../one-product-commissioning.js";
import { getOrBuildOneProductDecisionDossier } from "../one-product-decision-dossier.js";
import { getLatestExecutiveCycle } from "./store.js";
import type { CommercialSituation } from "./types.js";

function parseMoney(display: string | null | undefined): number | null {
  if (!display) return null;
  const n = Number(String(display).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parsePct(display: string | null | undefined): number | null {
  if (!display) return null;
  const n = Number(String(display).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function buildLiveCommercialSituation(workspaceId: string): CommercialSituation {
  const commission = getOneProductCommissioningRecord(workspaceId);
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const pending = getPillowCommercePresaleRepository().getPendingApprovalOpportunity(workspaceId);
  const previous = getLatestExecutiveCycle(workspaceId);
  let dossierDoc: ReturnType<typeof getOrBuildOneProductDecisionDossier>["dossier"] = null;
  try {
    dossierDoc = getOrBuildOneProductDecisionDossier(workspaceId).dossier;
  } catch {
    dossierDoc = null;
  }

  const productName =
    commission?.productName ||
    pending?.recommendation.productName ||
    dossierDoc?.product?.plainName ||
    "No active commissioning product";

  const ourPrice =
    parseMoney(dossierDoc?.economics?.ourPrice?.display) ??
    parseMoney(commission?.offerPrice) ??
    null;
  const lowest = parseMoney(dossierDoc?.economics?.lowestCompetitor?.display) ?? null;
  const premium =
    parsePct(dossierDoc?.economics?.priceDifferencePct) ??
    (ourPrice != null && lowest != null && lowest > 0
      ? ((ourPrice - lowest) / lowest) * 100
      : null);

  const demandRaw = String(dossierDoc?.demand?.evidence ?? "UNKNOWN").toUpperCase();
  const demandEvidence =
    demandRaw.includes("PRESENT") || demandRaw.includes("RANK")
      ? "PRESENT"
      : demandRaw.includes("WEAK")
        ? "WEAK"
        : "UNKNOWN";

  const deliveryRaw = String(dossierDoc?.delivery?.supplierCanMeet ?? "UNKNOWN").toUpperCase();
  const supplierCanMeetDelivery =
    deliveryRaw === "YES" || deliveryRaw === "NO" ? deliveryRaw : "UNKNOWN";

  const prior = String(
    dossierDoc?.pillowRecommendation?.verdict ?? commission?.pillowRecommendation ?? "",
  ).toUpperCase();
  const priorRecommendation =
    prior.includes("APPROVE")
      ? "APPROVE"
      : prior.includes("REJECT")
        ? "REJECT"
        : prior.includes("HOLD")
          ? "HOLD"
          : prior.includes("INVESTIGATE")
            ? "INVESTIGATE"
            : prior.includes("TEST")
              ? "TEST"
              : prior.includes("WAIT")
                ? "WAIT"
                : null;

  return {
    situationId:
      commission?.opportunityId ||
      pending?.opportunityId ||
      `live-${workspaceId}`,
    productName,
    corridor: "CJdropshipping → Amazon US",
    ourPriceUsd: ourPrice,
    lowestCompetitorUsd: lowest,
    pricePremiumPct: premium,
    expectedProfitUsd: parseMoney(commission?.expectedProfit) ?? null,
    expectedProfitStatus: "ESTIMATED",
    demandEvidence,
    supplierCanMeetDelivery,
    fulfilmentProfile: {
      originRegion: "CN",
      destinationMarketplace: "Amazon US",
      estimatedTransitDays: null,
      shippingCostUsd: null,
      warehouseRegionKnown: false,
      warehouseRegion: null,
    },
    published: (kpi.published ?? 0) > 0,
    buyable: kpi.buyable > 0 ? "YES" : kpi.published > 0 ? "UNKNOWN" : "UNKNOWN",
    orders: kpi.orders ?? 0,
    realisedRevenueUsd: kpi.realisedRevenueUsd ?? 0,
    supplierCostChangePct: null,
    priorRecommendation,
    gatedSpendRequiredUsd: null,
    spendAuthorityLimitUsd: null,
    notes: [
      "Built from live commissioning/dossier/KPI — UNKNOWN preserved",
      commission ? "commissioning record present" : "no commissioning record",
    ],
    previousStateFingerprint: previous?.stateFingerprint ?? null,
  };
}
