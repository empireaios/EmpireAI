/**
 * CQ-04 — Durable Grand King one-product decision dossier.
 * Bound to Pillow commissioning record (not floating commerceOpportunity).
 * Cursor does not select products.
 */

import { getDatabase } from "../../brain/database.js";
import {
  computePricePremiumPct,
  decideDossierVerdict,
} from "../pillow-commerce-presale/decide-dossier-verdict.js";
import { getPillowCommercePresaleRepository } from "../pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import type { QualifiedOpportunity } from "../pillow-commerce-presale/models.js";
import {
  getOneProductCommissioningRecord,
  type OneProductCommissioningRecord,
} from "./one-product-commissioning.js";
import { assessPostLaunchCommercialDeviations } from "./post-launch-commercial-deviation.js";

export type FinancialFieldStatus =
  | "VERIFIED_LIVE"
  | "VERIFIED_AS_OF"
  | "ESTIMATED"
  | "PARTIAL"
  | "STALE"
  | "UNKNOWN"
  | "NOT_YET_VERIFIED";

export type MoneyField = {
  label: string;
  display: string;
  amountUsd: number | null;
  currency: "USD";
  status: FinancialFieldStatus;
  source: string;
  asOf: string | null;
  coverage: string;
};

export type OneProductDecisionDossier = {
  dossierId: string;
  dossierVersion: "CQ04-OPDD-001";
  computedAt: string;
  identityReconciliation: {
    nordicBeddingStatus:
      | "HISTORICAL_MISSION_004_ONLY"
      | "LIVE_CANONICAL"
      | "UNKNOWN";
    nordicNote: string;
    commissioningPresent: boolean;
    commerceOpportunityDistinct: boolean;
    commerceOpportunityName: string | null;
    commerceOpportunityId: string | null;
  };
  selection: {
    selectionAuthority: "pillow";
    cursorSelected: false;
    selectedAt: string;
    commissioningId: string;
    opportunityId: string;
    sourcePool: string;
  };
  funnel: {
    candidatesEvaluated: number | null;
    rejectedBeforeDeepAnalysis: number | null;
    smartViableSurvivors: number | null;
    pillowAnalysedCount: number | null;
    finalists: Array<{
      productName: string;
      expectedProfit: string;
      opportunityId: string;
      role: "winner" | "runner_up";
      whyLost: string | null;
    }>;
    whyWinnerWon: string;
    historicalFunnelDetail: "NOT_RETAINED" | "PARTIAL" | "AVAILABLE";
  };
  product: {
    plainName: string;
    productType: string;
    listingRoute: string;
    listingRouteExplanation: string;
    brandRoute: string | null;
    imageAvailable: boolean;
    catalogImageUrl: string | null;
    customerFacingTitle: string;
    customerReceives: string;
    brandAppearsWhere: string;
  };
  marketplace: {
    marketplace: string;
    country: string;
  };
  supplier: {
    name: string;
    stockUnits: number | null;
    stockStatus: FinancialFieldStatus;
    supplierCost: MoneyField;
    freight: MoneyField;
    packagingBrandImplication: string;
  };
  economics: {
    ourPrice: MoneyField;
    lowestCompetitor: MoneyField;
    priceDifference: MoneyField;
    priceDifferencePct: string;
    competingOfferCount: string;
    featuredOffer: string;
    amazonFees: MoneyField;
    landedCost: MoneyField;
    breakEven: MoneyField;
    expectedProfit: MoneyField;
    expectedMargin: string;
    marginStatus: FinancialFieldStatus;
  };
  demand: {
    evidence: string;
    confidence: "low" | "medium" | "high" | "unknown";
    note: string;
  };
  delivery: {
    customerPromise: string;
    processing: string;
    transit: string;
    supplierCanMeet: string;
    naturalLanguage: string;
  };
  eligibility: {
    amazonEligibility: string;
    restrictionStatus: string;
    brandIp: string;
    catalogMatchQuality: string;
  };
  risks: string[];
  prominentCompetitionRisk: string | null;
  pillowRecommendation: {
    verdict: string;
    confidence: "high" | "medium" | "low";
    why: string;
    whatWouldChangeMind: string[];
    unsureAbout: string[];
  };
  grandKingDecision: {
    ifApprove: string[];
    ifReject: string[];
    currentState: string;
  };
  challengeInterface: {
    ready: boolean;
    askPromptSeed: string;
    exampleChallenges: string[];
    cq05Status: "AWAITING_GRAND_KING_AND_CHATGPT";
  };
  postLaunchAutonomyReadiness: {
    readyForRealTest: boolean;
    hardCodedPriceCutForbidden: true;
    detectionModule: string;
    note: string;
  };
  governance: {
    publicationAttempted: false;
    supplierSpendAttempted: false;
    birthTimestamp: null | string;
    thousandRelease: string;
  };
  technicalAppendix: {
    asin: string;
    amazonSellerSku: string;
    cjPid: string;
    cjVid: string | null;
    opportunityId: string;
    commissioningId: string;
    disposition: string | null;
    rawDeliveryPromise: string | null;
  };
  unknownFields: string[];
};

function money(
  label: string,
  amount: number | null | undefined,
  status: FinancialFieldStatus,
  source: string,
  asOf: string | null,
  coverage: string,
): MoneyField {
  const amountUsd = typeof amount === "number" && Number.isFinite(amount) ? amount : null;
  return {
    label,
    display: amountUsd == null ? "Unknown" : `$${amountUsd.toFixed(2)}`,
    amountUsd,
    currency: "USD",
    status,
    source,
    asOf,
    coverage,
  };
}

function parseUsd(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function freshnessToStatus(
  f: string | undefined,
): FinancialFieldStatus {
  switch (f) {
    case "LIVE":
      return "VERIFIED_LIVE";
    case "ESTIMATED":
      return "ESTIMATED";
    case "CACHED":
      return "PARTIAL";
    case "UNAVAILABLE":
      return "UNKNOWN";
    default:
      return "NOT_YET_VERIFIED";
  }
}

function ensureDossierTable(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_one_product_decision_dossier (
      workspace_id TEXT PRIMARY KEY,
      commissioning_id TEXT NOT NULL,
      opportunity_id TEXT NOT NULL,
      dossier_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function getPersistedOneProductDecisionDossier(
  workspaceId: string,
): OneProductDecisionDossier | null {
  ensureDossierTable();
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT dossier_json FROM pillow_one_product_decision_dossier WHERE workspace_id = @workspaceId`,
    )
    .get({ workspaceId }) as { dossier_json: string } | undefined;
  return row ? (JSON.parse(row.dossier_json) as OneProductDecisionDossier) : null;
}

function persistDossier(workspaceId: string, dossier: OneProductDecisionDossier): void {
  ensureDossierTable();
  const db = getDatabase();
  db.prepare(
    `INSERT INTO pillow_one_product_decision_dossier
      (workspace_id, commissioning_id, opportunity_id, dossier_json, updated_at)
     VALUES (@workspaceId, @commissioningId, @opportunityId, @json, @updatedAt)
     ON CONFLICT(workspace_id) DO UPDATE SET
       commissioning_id = excluded.commissioning_id,
       opportunity_id = excluded.opportunity_id,
       dossier_json = excluded.dossier_json,
       updated_at = excluded.updated_at`,
  ).run({
    workspaceId,
    commissioningId: dossier.selection.commissioningId,
    opportunityId: dossier.selection.opportunityId,
    json: JSON.stringify(dossier),
    updatedAt: dossier.computedAt,
  });
}

function buildFinalists(
  workspaceId: string,
  winner: OneProductCommissioningRecord,
): OneProductDecisionDossier["funnel"]["finalists"] {
  const repo = getPillowCommercePresaleRepository();
  const recent = repo.listRecentOpportunities(workspaceId, 24);
  const ranked = recent
    .filter((c) =>
      ["APPROVAL_READY", "AWAITING_APPROVAL", "APPROVED_PENDING_PUBLISH", "QUALIFIED"].includes(
        c.disposition,
      ),
    )
    .sort((a, b) => {
      const pa = parseUsd(a.recommendation.expectedProfit) ?? 0;
      const pb = parseUsd(b.recommendation.expectedProfit) ?? 0;
      return pb - pa;
    });
  const finalists: OneProductDecisionDossier["funnel"]["finalists"] = [
    {
      productName: winner.productName,
      expectedProfit: winner.expectedProfit,
      opportunityId: winner.opportunityId,
      role: "winner",
      whyLost: null,
    },
  ];
  for (const c of ranked) {
    if (c.opportunityId === winner.opportunityId) continue;
    if (finalists.length >= 4) break;
    finalists.push({
      productName: c.recommendation.productName,
      expectedProfit: c.recommendation.expectedProfit,
      opportunityId: c.opportunityId,
      role: "runner_up",
      whyLost: `Lower expected profit (${c.recommendation.expectedProfit}) than the Pillow-selected commissioning winner (${winner.expectedProfit}) at selection time.`,
    });
  }
  return finalists;
}

export function buildAndPersistOneProductDecisionDossier(
  workspaceId: string,
  opts?: { commerceOpportunityId?: string | null; commerceOpportunityName?: string | null },
): {
  ok: boolean;
  dossier: OneProductDecisionDossier | null;
  error?: string;
} {
  const commissioning = getOneProductCommissioningRecord(workspaceId);
  if (!commissioning) {
    return {
      ok: false,
      dossier: null,
      error:
        "No Pillow commissioning record. Trigger POST /pillow-commissioning/one-product/run so Pillow selects from production opportunities. Cursor must not preselect.",
    };
  }

  const repo = getPillowCommercePresaleRepository();
  const opp: QualifiedOpportunity | null = repo.getOpportunityById(
    workspaceId,
    commissioning.opportunityId,
  );
  const d = opp?.dossier ?? null;
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const postLaunch = assessPostLaunchCommercialDeviations(workspaceId);
  const now = new Date().toISOString();
  const asOf = d?.computedAt ?? commissioning.updatedAt;

  const ourPriceN =
    d?.economics.proposedSellingPriceUsd ?? parseUsd(commissioning.offerPrice);
  const competitorN = d?.marketplaceCompetition.lowestCompetitorPriceUsd ?? null;
  const delta =
    ourPriceN != null && competitorN != null ? ourPriceN - competitorN : null;
  const deltaPct =
    delta != null && competitorN && competitorN > 0
      ? `${((delta / competitorN) * 100).toFixed(0)}%`
      : "Unknown";
  const supplierCostN =
    d?.supplier.productCost.amountUsd ?? parseUsd(commissioning.supplierCost);
  const freightN = d?.supplier.usShipping.amountUsd ?? parseUsd(commissioning.freight);
  const feesN = d?.economics.amazonFees.amountUsd ?? null;
  const landed =
    supplierCostN != null && freightN != null ? supplierCostN + freightN : null;
  const breakEven = d?.economics.sensitivity.breakEvenPriceUsd ?? null;
  const profitN =
    d?.economics.expectedProfitUsd ?? parseUsd(commissioning.expectedProfit);

  const expensive =
    delta != null && delta > 0
      ? `Our proposed price is about $${delta.toFixed(2)} (${deltaPct.startsWith("-") ? deltaPct : `+${deltaPct.replace(/^\+/, "")}`}) above the lowest competing offer. This is a material commercial risk — positive expected margin alone does not justify the price.`
      : null;

  const pricePremiumPct = computePricePremiumPct(ourPriceN, competitorN);
  const demandUnknown = /UNKNOWN/i.test(
    d?.demandFulfilmentRisk.demandEvidence ?? "UNKNOWN",
  );
  const recomputed = decideDossierVerdict({
    brandRoute: d?.eligibilityAndBrand.brandRoute ?? "GENERIC_UNBRANDED",
    deliveryCanMeet: d?.demandFulfilmentRisk.delivery.supplierCanMeet ?? "UNKNOWN",
    amazonEligibility:
      (d?.eligibilityAndBrand.amazonEligibility as "PASS" | "FAIL" | "UNKNOWN") ??
      "UNKNOWN",
    profitOk: (profitN ?? 0) >= 1,
    pricePremiumPct,
    demandEvidencePresent: !demandUnknown,
    competingOfferCount: d?.marketplaceCompetition.competingOfferCount ?? null,
  });
  // Recompute against commercial uncertainty standard — do not inherit a stale APPROVE
  // when demand/price evidence would force INVESTIGATE/WAIT/TEST.
  const recommendationVerdict = recomputed.verdict;
  const recommendationWhy = recomputed.why;
  const unsureAbout = [
    demandUnknown ? "Demand evidence is UNKNOWN — catalog existence is not demand proof." : null,
    pricePremiumPct != null && pricePremiumPct >= 25
      ? `Price is about ${pricePremiumPct.toFixed(0)}% above the lowest competing offer.`
      : null,
    d?.demandFulfilmentRisk.delivery.supplierCanMeet !== "YES"
      ? "Whether the supplier can reliably meet the Amazon delivery promise."
      : null,
    !d?.presentation.imagesAssessment?.includes("available")
      ? "Catalog image not yet available from Amazon APIs."
      : null,
  ].filter(Boolean) as string[];

  const finalists = buildFinalists(workspaceId, commissioning);
  const unknownFields = [
    ...(d?.unknownFields ?? []),
    !d ? "fullCommercialDossierMissingFromOpportunityRow" : null,
    competitorN == null ? "lowestCompetitorPrice" : null,
    /UNKNOWN/i.test(d?.demandFulfilmentRisk.demandEvidence ?? "UNKNOWN")
      ? "demandEvidence"
      : null,
  ].filter(Boolean) as string[];

  const askPromptSeed = [
    `Challenge/defend the CQ-04 one-product commissioning dossier for "${commissioning.productName}".`,
    `Selection authority=Pillow; Cursor did not select this product.`,
    `Proposed price ${commissioning.offerPrice}; expected profit ${commissioning.expectedProfit} (EXPECTED — not realised).`,
    competitorN != null
      ? `Lowest competing offer about $${competitorN.toFixed(2)} (${deltaPct} difference).`
      : "Competitor price unknown.",
    `Demand: ${d?.demandFulfilmentRisk.demandEvidence ?? "UNKNOWN"}.`,
    "Answer only from dossier evidence and institutional memory. Do not invent LIVE figures.",
  ].join(" ");

  const dossier: OneProductDecisionDossier = {
    dossierId: `cq04_${commissioning.commissioningId}`,
    dossierVersion: "CQ04-OPDD-001",
    computedAt: now,
    identityReconciliation: {
      nordicBeddingStatus: "HISTORICAL_MISSION_004_ONLY",
      nordicNote:
        "Mission 004 Nordic bedding ($90.24 expected) is historical evidence only. Live commissioning ledger was null before Pillow reselection; Nordic was not restored by Cursor.",
      commissioningPresent: true,
      commerceOpportunityDistinct: Boolean(
        opts?.commerceOpportunityId &&
          opts.commerceOpportunityId !== commissioning.opportunityId,
      ),
      commerceOpportunityName: opts?.commerceOpportunityName ?? null,
      commerceOpportunityId: opts?.commerceOpportunityId ?? null,
    },
    selection: {
      selectionAuthority: "pillow",
      cursorSelected: false,
      selectedAt: commissioning.createdAt,
      commissioningId: commissioning.commissioningId,
      opportunityId: commissioning.opportunityId,
      sourcePool:
        "Persisted production SMART opportunities (APPROVAL_READY / AWAITING_APPROVAL / QUALIFIED), ranked by expected profit by Pillow runtime",
    },
    funnel: {
      candidatesEvaluated: kpi.candidatesEvaluated,
      rejectedBeforeDeepAnalysis: kpi.rejected,
      smartViableSurvivors: kpi.smartViable,
      pillowAnalysedCount: null,
      finalists,
      whyWinnerWon:
        d?.exposureAndAction.why ??
        `Pillow ranked available production opportunities by expected profit and selected "${commissioning.productName}" (${commissioning.expectedProfit} expected — not realised).`,
      historicalFunnelDetail: "PARTIAL",
    },
    product: {
      plainName: commissioning.productName,
      productType: "Dropship offer on Amazon US catalog (generic/unbranded route unless noted)",
      listingRoute: d?.presentation.listingRoute ?? "OFFER_ON_EXISTING_ASIN",
      listingRouteExplanation:
        "We are joining an existing Amazon product page. Amazon controls the catalog images/title/content. EmpireAI is adding our seller offer.",
      brandRoute: commissioning.brandRoute,
      imageAvailable: false,
      catalogImageUrl: null,
      customerFacingTitle: commissioning.productName,
      customerReceives:
        d?.eligibilityAndBrand.customerReceives ??
        "Supplier-fulfilled product matching the Amazon catalog listing attributes.",
      brandAppearsWhere:
        d?.eligibilityAndBrand.brandAppearsWhere ??
        "No EmpireAI private-label branding applied on product/packaging for this route.",
    },
    marketplace: {
      marketplace: "Amazon",
      country: "United States",
    },
    supplier: {
      name: "CJdropshipping",
      stockUnits: d?.supplier.stockUnits ?? null,
      stockStatus: freshnessToStatus(d?.supplier.stockFreshness),
      supplierCost: money(
        "Supplier cost",
        supplierCostN,
        freshnessToStatus(d?.supplier.productCost.freshness),
        d?.supplier.productCost.source ?? "commissioning-record",
        asOf,
        "CJ product cost for mapped variant",
      ),
      freight: money(
        "Freight / shipping",
        freightN,
        freshnessToStatus(d?.supplier.usShipping.freshness),
        d?.supplier.usShipping.source ?? "commissioning-record",
        asOf,
        "CJ US shipping quote for mapped variant",
      ),
      packagingBrandImplication:
        "Generic/unbranded offer — Amazon catalog presentation; supplier packaging may appear unmarked or supplier-default.",
    },
    economics: {
      ourPrice: money(
        "Our proposed price",
        ourPriceN,
        "ESTIMATED",
        "Pillow commercial dossier / recommendation",
        asOf,
        "Proposed Amazon offer price — not realised revenue",
      ),
      lowestCompetitor: money(
        "Lowest competing price",
        competitorN,
        competitorN == null ? "UNKNOWN" : "PARTIAL",
        d?.marketplaceCompetition.source ?? "amazon-competitive-snapshot",
        asOf,
        "Lowest observed competing offer at dossier compute",
      ),
      priceDifference: money(
        "Price difference vs lowest competitor",
        delta,
        delta == null ? "UNKNOWN" : "PARTIAL",
        "derived",
        asOf,
        "Our price minus lowest competitor",
      ),
      priceDifferencePct: delta == null ? "Unknown" : `${delta >= 0 ? "+" : ""}${deltaPct}`,
      competingOfferCount:
        d?.marketplaceCompetition.competingOfferCount != null
          ? String(d.marketplaceCompetition.competingOfferCount)
          : commissioning.competingOffers ?? "Unknown",
      featuredOffer: [
        `Eligible: ${d?.marketplaceCompetition.featuredOfferEligible ?? "UNKNOWN"}`,
        `Currently featured: ${d?.marketplaceCompetition.currentlyFeaturedOffer ?? "UNKNOWN"}`,
        d?.marketplaceCompetition.featuredOfferPriceUsd != null
          ? `Featured price ~$${d.marketplaceCompetition.featuredOfferPriceUsd.toFixed(2)}`
          : "Featured price unknown",
      ].join(" · "),
      amazonFees: money(
        "Amazon fees",
        feesN,
        freshnessToStatus(d?.economics.amazonFees.freshness),
        d?.economics.amazonFees.source ?? "fee-estimate",
        asOf,
        "Estimated referral/closing fees for proposed price",
      ),
      landedCost: money(
        "Landed cost (supplier + freight)",
        landed,
        landed == null ? "UNKNOWN" : "PARTIAL",
        "derived from CJ cost+ship",
        asOf,
        "Does not include Amazon fees",
      ),
      breakEven: money(
        "Break-even price",
        breakEven,
        breakEven == null ? "UNKNOWN" : "ESTIMATED",
        "dossier sensitivity",
        asOf,
        "Estimated break-even selling price",
      ),
      expectedProfit: money(
        "Expected profit",
        profitN,
        "ESTIMATED",
        "Pillow recommendation — NOT realised profit",
        asOf,
        "Expected contribution per sale if buyable and sold at proposed price",
      ),
      expectedMargin: commissioning.expectedMargin,
      marginStatus: "ESTIMATED",
    },
    demand: {
      evidence:
        d?.demandFulfilmentRisk.demandEvidence ??
        "Sales rank UNKNOWN from authorized APIs. Existence on Amazon is not demand proof.",
      confidence: "unknown",
      note: "Do not treat catalog existence as demand.",
    },
    delivery: {
      customerPromise:
        d?.demandFulfilmentRisk.delivery.customerExpectation?.replace(
          /Honest MF config required[^.]*\./i,
          "Amazon delivery promise must match the supplier's actual shipping time.",
        ) ??
        commissioning.deliveryPromise?.replace(
          /Honest MF config required[^.]*\./i,
          "Amazon delivery promise must match the supplier's actual shipping time.",
        ) ??
        "Delivery promise incomplete.",
      processing: d?.supplier.processingDays ?? "Unknown",
      transit:
        d?.demandFulfilmentRisk.delivery.carrierTransitDaysMin != null
          ? `${d.demandFulfilmentRisk.delivery.carrierTransitDaysMin}–${d.demandFulfilmentRisk.delivery.carrierTransitDaysMax} days transit (estimated)`
          : "Unknown",
      supplierCanMeet: d?.demandFulfilmentRisk.delivery.supplierCanMeet ?? "UNKNOWN",
      naturalLanguage:
        "Customer delivery must reflect real supplier processing and China→US transit — not a short domestic promise.",
    },
    eligibility: {
      amazonEligibility: d?.eligibilityAndBrand.amazonEligibility ?? "UNKNOWN",
      restrictionStatus: d?.eligibilityAndBrand.restrictionStatus ?? "UNKNOWN",
      brandIp: d?.eligibilityAndBrand.ipCompliance ?? "UNKNOWN",
      catalogMatchQuality:
        "Catalog ASIN match may be keyword-based — verify fulfilment map before publish.",
    },
    risks: [
      ...(d?.demandFulfilmentRisk.riskReasons ?? commissioning.riskReasons),
      ...(expensive ? [expensive] : []),
      "Demand evidence is not verified.",
      "Expected profit is not realised profit.",
      "Publication and supplier spend remain gated until Grand King approval.",
    ],
    prominentCompetitionRisk: expensive,
    pillowRecommendation: {
      verdict: recommendationVerdict,
      confidence: recomputed.confidence,
      why: recommendationWhy,
      whatWouldChangeMind: [
        "A higher-quality opportunity with better price competitiveness and verified demand",
        "Amazon eligibility/restriction failure on revalidation",
        "Supplier stock/cost/freight deterioration that collapses expected margin",
        "Evidence that customers will not buy at a large premium vs lowest competitor",
        "Brand/IP conflict or catalog match failure",
      ],
      unsureAbout,
    },
    grandKingDecision: {
      ifApprove: (
        d?.exposureAndAction.exactActionAfterApproval ??
        "1) Revalidate stock/cost/freight/fees/restrictions. 2) Publish LISTING_OFFER_ONLY with Amazon↔CJ map. 3) Verify BUYABLE (ACCEPTED≠BUYABLE). 4) Monitor offer. 5) On real order: approval-gated CJ createOrder. 6) Sync tracking. 7) confirmShipment. 8) Record actual P&L. 9) Capture institutional memory."
      )
        .split(/(?=\d\))/)
        .map((s) => s.trim())
        .filter(Boolean),
      ifReject: [
        "This commissioning candidate is not published.",
        "No supplier spend occurs.",
        "Pillow continues SMART discovery toward the 1,000 commercially ready surface.",
        "Grand King may later ask Pillow to select another commissioning candidate via the production pipeline (Cursor must not pick).",
      ],
      currentState: commissioning.grandKingDecision,
    },
    challengeInterface: {
      ready: true,
      askPromptSeed,
      exampleChallenges: [
        "Why this product?",
        "Why this price vs the cheapest competitor?",
        "What evidence shows demand?",
        "What if there are no sales after publish?",
        "What if competitor price drops?",
        "What if supplier cost rises?",
        "Why not select another product?",
        "What are you least confident about?",
        "What evidence would make you reject your own recommendation?",
      ],
      cq05Status: "AWAITING_GRAND_KING_AND_CHATGPT",
    },
    postLaunchAutonomyReadiness: {
      readyForRealTest: true,
      hardCodedPriceCutForbidden: true,
      detectionModule: "post-launch-commercial-deviation",
      note: postLaunch.notes.join(" "),
    },
    governance: {
      publicationAttempted: false,
      supplierSpendAttempted: false,
      birthTimestamp: null,
      thousandRelease: "AWAITING_GRAND_KING_AND_CHATGPT",
    },
    technicalAppendix: {
      asin: commissioning.asin,
      amazonSellerSku: commissioning.amazonSellerSku,
      cjPid: commissioning.cjPid,
      cjVid: d?.productIdentity.cjVid ?? null,
      opportunityId: commissioning.opportunityId,
      commissioningId: commissioning.commissioningId,
      disposition: opp?.disposition ?? null,
      rawDeliveryPromise: commissioning.deliveryPromise,
    },
    unknownFields,
  };

  persistDossier(workspaceId, dossier);
  return { ok: true, dossier };
}

export function getOrBuildOneProductDecisionDossier(
  workspaceId: string,
  opts?: { commerceOpportunityId?: string | null; commerceOpportunityName?: string | null },
): {
  ok: boolean;
  dossier: OneProductDecisionDossier | null;
  error?: string;
  persisted: boolean;
} {
  const existing = getPersistedOneProductDecisionDossier(workspaceId);
  const commissioning = getOneProductCommissioningRecord(workspaceId);
  if (
    existing &&
    commissioning &&
    existing.selection.opportunityId === commissioning.opportunityId &&
    existing.selection.commissioningId === commissioning.commissioningId
  ) {
    return { ok: true, dossier: existing, persisted: true };
  }
  const built = buildAndPersistOneProductDecisionDossier(workspaceId, opts);
  return { ...built, persisted: Boolean(built.dossier) };
}
