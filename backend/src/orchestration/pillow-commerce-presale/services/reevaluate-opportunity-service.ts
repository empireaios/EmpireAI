/**
 * Pillow re-evaluates a previously qualified opportunity under FD-CDD-001.
 * Cursor observes/repairs only — does not manufacture the dossier.
 */
import { randomUUID } from "node:crypto";

import { logger } from "../../../config/logger.js";
import { createCjApiClient } from "../../../suppliers/cj-dropshipping/cj-api-client.js";
import { loadCjConfig, isCjLiveApiEnabled } from "../../../suppliers/cj-dropshipping/cj-config.js";
import {
  estimateAmazonFees,
  getCatalogItemDetails,
  getCompetitiveOfferSnapshot,
  getListingsRestrictions,
  isProof001FailureClass,
  openAmazonUsSession,
} from "../amazon-commerce-preflight.js";
import {
  assembleCommercialDecisionDossier,
  pickCheapestFreight,
} from "../assemble-commercial-dossier.js";
import { buildCommerceOperatingLoopReadiness } from "../commerce-operating-loop.js";
import {
  pickLiveCjVariant,
  coerceUsdNumber,
  mergeCjVariantQueryIntoProduct,
} from "../cj-live-normalize.js";
import { calculateExpectedContribution, proposeSellingPrice } from "../economics.js";
import {
  DEFAULT_START_QUANTITY,
  STANDING_COMMERCE_OBJECTIVE,
  formatMoneyEvidence,
  type MoneyEvidence,
  type QualifiedOpportunity,
  type RejectionReasonCode,
} from "../models.js";
import {
  captureInstitutionalMemory,
  getCommerceInstitutionalContext,
} from "../../executive-learning/institutional-memory-service.js";
import { getPillowCommercePresaleRepository } from "../repository/sqlite-pillow-commerce-presale-repository.js";
import type { ApprovalGateEngine } from "../../pillow-approval/approval-gate-engine.js";

export type ReevaluateOpportunityInput = {
  workspaceId: string;
  companyId: string;
  /** Prefer exact identity when provided. */
  asin?: string;
  cjPid?: string;
  amazonSellerSku?: string;
  approvalGate?: ApprovalGateEngine | null;
  env?: NodeJS.ProcessEnv;
  /** After REJECT, optionally start a fresh discovery cycle (caller responsibility). */
  continueDiscoveryOnReject?: boolean;
};

export type ReevaluateOpportunityResult = {
  reevaluatedAt: string;
  actorWasCursor: false;
  publicationAttempted: false;
  supplierSpendAttempted: false;
  target: {
    asin: string | null;
    cjPid: string | null;
    amazonSellerSku: string | null;
  };
  outcome: "DOSSIER_APPROVE_SURFACED" | "DOSSIER_REJECTED" | "BLOCKED_INTEGRATION" | "NO_TARGET";
  opportunity: QualifiedOpportunity | null;
  dossierSummary: string | null;
  rejectReason: string | null;
  rejectCode: string | null;
  operatingLoop: ReturnType<typeof buildCommerceOperatingLoopReadiness>;
  nextPillowAction: string;
};

function sumStock(stockPayload: unknown): number {
  const rows = Array.isArray(stockPayload)
    ? stockPayload
    : stockPayload && typeof stockPayload === "object"
      ? [stockPayload]
      : [];
  let total = 0;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    for (const key of ["inventory", "totalInventoryNum", "cjInventoryNum", "storageNum"]) {
      const n = r[key];
      if (typeof n === "number" && Number.isFinite(n) && n > total) total = n;
    }
  }
  return total;
}

export async function reevaluateCommerceOpportunity(
  input: ReevaluateOpportunityInput,
): Promise<ReevaluateOpportunityResult> {
  const env = input.env ?? process.env;
  const repo = getPillowCommercePresaleRepository();
  const operatingLoop = buildCommerceOperatingLoopReadiness();
  const base = {
    reevaluatedAt: new Date().toISOString(),
    actorWasCursor: false as const,
    publicationAttempted: false as const,
    supplierSpendAttempted: false as const,
    operatingLoop,
  };

  const pending = repo.getPendingApprovalOpportunity(input.workspaceId);
  const latest = repo.getLatestOpportunity(input.workspaceId);
  const targetOpp =
    pending &&
    (!input.asin || pending.mapping.asin === input.asin) &&
    (!input.cjPid || pending.mapping.cjPid === input.cjPid) &&
    (!input.amazonSellerSku || pending.mapping.amazonSellerSku === input.amazonSellerSku)
      ? pending
      : latest &&
          (!input.asin || latest.mapping.asin === input.asin) &&
          (!input.cjPid || latest.mapping.cjPid === input.cjPid)
        ? latest
        : pending ?? latest;

  if (!targetOpp && !(input.asin && input.cjPid)) {
    return {
      ...base,
      target: { asin: input.asin ?? null, cjPid: input.cjPid ?? null, amazonSellerSku: input.amazonSellerSku ?? null },
      outcome: "NO_TARGET",
      opportunity: null,
      dossierSummary: null,
      rejectReason: "No opportunity found to re-evaluate",
      rejectCode: null,
      nextPillowAction: "Run autonomous discovery cycle to locate a candidate.",
    };
  }

  const asin = input.asin ?? targetOpp!.mapping.asin;
  const cjPid = input.cjPid ?? targetOpp!.mapping.cjPid;
  const amazonSellerSku =
    input.amazonSellerSku ?? targetOpp?.mapping.amazonSellerSku ?? `EMP-FD-${Date.now().toString(36).toUpperCase()}`;

  const target = { asin, cjPid, amazonSellerSku };

  if (!isCjLiveApiEnabled(env)) {
    return {
      ...base,
      target,
      outcome: "BLOCKED_INTEGRATION",
      opportunity: targetOpp,
      dossierSummary: null,
      rejectReason: "CJ live API not enabled",
      rejectCode: "SUPPLIER_UNAVAILABLE",
      nextPillowAction: "Restore CJ live integration, then re-evaluate.",
    };
  }

  const amazon = await openAmazonUsSession(env);
  if (!amazon.session) {
    return {
      ...base,
      target,
      outcome: "BLOCKED_INTEGRATION",
      opportunity: targetOpp,
      dossierSummary: null,
      rejectReason: amazon.blocker ?? "Amazon session unavailable",
      rejectCode: "SUPPLIER_UNAVAILABLE",
      nextPillowAction: "Restore Amazon credentials, then re-evaluate.",
    };
  }

  const cj = createCjApiClient(loadCjConfig(env));
  const commerceMemory = getCommerceInstitutionalContext(input.workspaceId);

  let detail;
  try {
    const queried = await cj.queryProduct(cjPid);
    detail = queried.data;
  } catch (error) {
    return {
      ...base,
      target,
      outcome: "BLOCKED_INTEGRATION",
      opportunity: targetOpp,
      dossierSummary: null,
      rejectReason: `CJ product query failed: ${error instanceof Error ? error.message : String(error)}`,
      rejectCode: "SUPPLIER_UNAVAILABLE",
      nextPillowAction: "Retry when CJ is reachable.",
    };
  }
  if (!detail) {
    return {
      ...base,
      target,
      outcome: "DOSSIER_REJECTED",
      opportunity: targetOpp,
      dossierSummary: null,
      rejectReason: "CJ product not found",
      rejectCode: "SUPPLIER_UNAVAILABLE",
      nextPillowAction: "Reject stale mapping and discover another opportunity.",
    };
  }

  let picked = pickLiveCjVariant(detail);
  if (picked.costUsd === null) {
    try {
      const variantQuery = await cj.queryProductVariants(cjPid);
      detail = mergeCjVariantQueryIntoProduct(detail, variantQuery.data);
      picked = pickLiveCjVariant(detail);
    } catch {
      /* keep */
    }
  }
  const variant = picked.variant;
  const preferredVid = targetOpp?.mapping.cjVid;
  if (preferredVid && detail.variantList?.length) {
    const match = detail.variantList.find((v) => v.vid === preferredVid);
    if (match) {
      const matchRec = match as Record<string, unknown>;
      const cost =
        coerceUsdNumber(matchRec.variantSellPrice) ??
        coerceUsdNumber(matchRec.sellPrice) ??
        coerceUsdNumber(matchRec.price);
      if (cost !== null) {
        picked = { variant: match, costUsd: cost };
      }
    }
  }

  if (!picked.variant?.vid || picked.costUsd === null) {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: "COST_UNAVAILABLE",
      reason: "Live supplier cost UNAVAILABLE on re-evaluation",
      operatingLoop,
    });
  }

  const productName =
    detail.productNameEn || detail.productName || targetOpp?.recommendation.productName || cjPid;

  if (
    isProof001FailureClass({ asin, productName }) ||
    commerceMemory.mustAvoidAsins.includes(asin.toUpperCase())
  ) {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: "PROOF_001_BRAND_FAILURE_CLASS",
      reason: "Institutional memory blocks this ASIN/brand-gate pattern",
      operatingLoop,
    });
  }

  let stockUnits = 0;
  try {
    const byVid = await cj.queryStockByVid(picked.variant.vid);
    stockUnits = sumStock(byVid.data);
  } catch {
    stockUnits = typeof picked.variant.inventory === "number" ? picked.variant.inventory : 0;
  }
  if (stockUnits <= 0) {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: "OUT_OF_STOCK",
      reason: "Live stock UNAVAILABLE or 0 on re-evaluation",
      operatingLoop,
    });
  }

  let freightOption = null;
  let shippingAmount: number | null = null;
  try {
    const freight = await cj.calculateFreight({
      startCountryCode: "CN",
      endCountryCode: "US",
      products: [{ quantity: 1, vid: picked.variant.vid }],
    });
    const pickedFreight = pickCheapestFreight(freight.data ?? []);
    shippingAmount = pickedFreight.priceUsd;
    freightOption = pickedFreight.option;
  } catch (error) {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: "FREIGHT_UNAVAILABLE",
      reason: `US freight failed: ${error instanceof Error ? error.message : String(error)}`,
      operatingLoop,
    });
  }
  if (shippingAmount === null) {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: "FREIGHT_UNAVAILABLE",
      reason: "No US freight options on re-evaluation",
      operatingLoop,
    });
  }

  const restrictions = await getListingsRestrictions(amazon.session, asin);
  if (restrictions.restricted) {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: restrictions.qualificationRequired ? "QUALIFICATION_REQUIRED" : "AMAZON_RESTRICTION",
      reason: restrictions.reasons.join(" | ") || "Amazon restriction",
      operatingLoop,
    });
  }

  let price = proposeSellingPrice({
    supplierCostUsd: picked.costUsd,
    shippingUsd: shippingAmount,
    suggestSellPriceUsd:
      coerceUsdNumber(picked.variant.suggestSellPrice) ?? coerceUsdNumber(detail.suggestSellPrice),
  });
  let fees = await estimateAmazonFees(amazon.session, asin, price);
  if (fees.totalFeesUsd === null) {
    price = Number((price * 1.2).toFixed(2));
    fees = await estimateAmazonFees(amazon.session, asin, price);
  }
  if (fees.totalFeesUsd === null) {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: "FEE_UNAVAILABLE",
      reason: fees.blocker ?? "Amazon fee estimate UNAVAILABLE",
      operatingLoop,
    });
  }

  const costEv: MoneyEvidence = {
    amountUsd: picked.costUsd,
    freshness: "LIVE",
    source: "cj.product.variant.sellPrice",
  };
  const shipEv: MoneyEvidence = {
    amountUsd: shippingAmount,
    freshness: "LIVE",
    source: "cj.logistic.freightCalculate US",
  };
  const feeEv: MoneyEvidence = {
    amountUsd: fees.totalFeesUsd,
    freshness: "LIVE",
    source: "amazon.feesEstimate",
  };
  const economics = calculateExpectedContribution({
    proposedSellingPriceUsd: price,
    amazonFees: feeEv,
    supplierCost: costEv,
    shipping: shipEv,
  });
  if (!economics.passesGate || economics.expectedProfitUsd === null) {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: "LOSS_MAKING",
      reason: economics.blocker ?? "Failed profit gate on re-evaluation",
      operatingLoop,
    });
  }

  const catalog = await getCatalogItemDetails(amazon.session, asin);
  const competition = await getCompetitiveOfferSnapshot(amazon.session, asin, price);
  const now = new Date().toISOString();
  const assembled = assembleCommercialDecisionDossier({
    productName: catalog.itemName || productName,
    marketplaceId: amazon.session.marketplaceId,
    asin,
    amazonSellerSku,
    cjPid,
    cjVid: picked.variant.vid,
    cjVariantSku: picked.variant.sku || picked.variant.vid,
    mappingTimestamp: now,
    stockUnits,
    stockFreshness: "LIVE",
    productCost: costEv,
    usShipping: shipEv,
    amazonFees: feeEv,
    proposedSellingPriceUsd: price,
    expectedProfitUsd: economics.expectedProfitUsd,
    expectedMarginPct: economics.expectedMarginPct ?? 0,
    brandName: catalog.brandName,
    amazonEligibility: "PASS",
    restrictionStatus: "PASS — listingsRestrictions clear at re-evaluation",
    competition,
    freightOption,
    salesRank: catalog.salesRank,
    risks: [
      "Re-evaluated under FD-CDD-001 complete dossier standard",
      "Offer not published — BUYABLE must be verified after publication",
      `Starting quantity ${DEFAULT_START_QUANTITY}`,
      ...commerceMemory.lessons.slice(0, 2).map((l) => `Institutional memory: ${l}`),
    ],
  });

  if (assembled.verdict === "REJECT") {
    return finalizeReject({
      input,
      targetOpp,
      target,
      reasonCode: (assembled.rejectCode ?? "DOSSIER_REJECT") as RejectionReasonCode,
      reason: assembled.why,
      operatingLoop,
      dossierSummary: assembled.dossier.grandKingSummary,
      dossier: assembled.dossier,
    });
  }

  const mapping = {
    marketplaceId: amazon.session.marketplaceId,
    asin,
    amazonSellerSku,
    cjPid,
    cjVid: picked.variant.vid,
    cjVariantSku: picked.variant.sku || picked.variant.vid,
    supplierCostUsd: costEv,
    shippingUsd: shipEv,
    amazonFeesUsd: feeEv,
    proposedSellingPriceUsd: price,
    expectedProfitUsd: economics.expectedProfitUsd,
    expectedMarginPct: economics.expectedMarginPct ?? 0,
    startQuantity: DEFAULT_START_QUANTITY,
    verifiedAt: now,
  };

  const recommendation = {
    headline: "COMMERCE OPPORTUNITY — GRAND KING DECISION",
    productName: catalog.itemName || productName,
    amazonUsEligibility: `Preflight clear for ASIN ${asin} (NOT published; NOT BUYABLE yet)`,
    supplier: "CJdropshipping" as const,
    supplierStock: `${stockUnits} units [LIVE]`,
    supplierCost: formatMoneyEvidence(costEv),
    usShipping: formatMoneyEvidence(shipEv),
    amazonFees: formatMoneyEvidence(feeEv),
    proposedSellingPrice: `$${price.toFixed(2)}`,
    expectedProfit: `$${economics.expectedProfitUsd.toFixed(2)}`,
    expectedMargin: `${(economics.expectedMarginPct ?? 0).toFixed(2)}%`,
    riskSummary: assembled.dossier.demandFulfilmentRisk.riskReasons.join("; "),
    pillowRecommendation: "APPROVE" as const,
    proposedActionAfterApproval:
      assembled.dossier.exposureAndAction.exactActionAfterApproval,
    fullNarrative: `${assembled.dossier.grandKingSummary}\n\n${commerceMemory.formatted}`,
  };

  let approvalId = targetOpp?.approvalId ?? null;
  let approvalStatus = targetOpp?.approvalStatus ?? ("none" as const);
  if ((!approvalId || approvalStatus === "Rejected" || approvalStatus === "Cancelled") && input.approvalGate) {
    try {
      const approval = input.approvalGate.register({
        workspaceId: input.workspaceId,
        type: "runtime_operation",
        requestedBy: "pillow-commerce-presale",
        correlationId: randomUUID(),
        proposal: {
          title: recommendation.headline,
          summary: recommendation.fullNarrative,
          ownerRoute: "/cockpit/commerce/workspace",
          evidence: [
            `asin:${asin}`,
            `cjPid:${cjPid}`,
            "dossier:FD-CDD-001",
            "reevaluated:true",
            "publicationAttempted:false",
          ],
          metadata: {
            opportunityKind: "first_dollar_presale",
            amazonSellerSku,
            asin,
            cjPid,
            standingObjective: STANDING_COMMERCE_OBJECTIVE,
            publicationAllowed: false,
            supplierSpendAllowed: false,
            dossierVersion: "FD-CDD-001",
          },
        },
      });
      approvalId = approval.approvalId;
      approvalStatus = "Pending";
    } catch (error) {
      logger.warn({ err: error }, "Re-eval approval registration failed");
    }
  }

  const opportunity: QualifiedOpportunity = {
    opportunityId: targetOpp?.opportunityId ?? randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    disposition: approvalId ? "AWAITING_APPROVAL" : "APPROVAL_READY",
    preflightOfferState: "NOT_PUBLISHED",
    mapping,
    stockUnits,
    stockFreshness: "LIVE",
    risks: assembled.dossier.demandFulfilmentRisk.riskReasons,
    recommendation,
    dossier: assembled.dossier,
    approvalId,
    approvalStatus: approvalId ? "Pending" : "none",
    publicationAllowed: false,
    supplierSpendAllowed: false,
    createdAt: targetOpp?.createdAt ?? now,
    updatedAt: now,
  };

  repo.saveMapping(mapping, input.workspaceId);
  repo.saveOpportunity(opportunity);

  captureInstitutionalMemory({
    workspaceId: input.workspaceId,
    canonicalKey: `commerce.reeval.${opportunity.opportunityId}`,
    title: `Pillow re-evaluated ${asin} under FD-CDD-001 — APPROVE`,
    statement: assembled.why,
    memoryClass: "pillow_self_improvement",
    authority: "pillow_recommendation",
    epistemicStatus: "RECOMMENDATION",
    source: "commerce_event",
    tags: ["commerce", "reevaluation", "dossier", "approve"],
    evidenceRefs: [`asin:${asin}`, `cjPid:${cjPid}`, "dossier:FD-CDD-001"],
    linkedEntities: { asin, cjPid, amazonSellerSku, opportunityId: opportunity.opportunityId },
    category: "C",
    actor: "pillow-commerce-presale",
  });

  return {
    ...base,
    target,
    outcome: "DOSSIER_APPROVE_SURFACED",
    opportunity,
    dossierSummary: assembled.dossier.grandKingSummary,
    rejectReason: null,
    rejectCode: null,
    nextPillowAction:
      "Surface complete Grand King dossier and wait only at constitutional approval gate. Do not publish.",
  };
}

async function finalizeReject(input: {
  input: ReevaluateOpportunityInput;
  targetOpp: QualifiedOpportunity | null | undefined;
  target: { asin: string; cjPid: string; amazonSellerSku: string };
  reasonCode: RejectionReasonCode;
  reason: string;
  operatingLoop: ReturnType<typeof buildCommerceOperatingLoopReadiness>;
  dossierSummary?: string | null;
  dossier?: QualifiedOpportunity["dossier"];
}): Promise<ReevaluateOpportunityResult> {
  const repo = getPillowCommercePresaleRepository();
  const now = new Date().toISOString();
  let opportunity: QualifiedOpportunity | null = input.targetOpp ?? null;
  if (opportunity) {
    opportunity = {
      ...opportunity,
      disposition: "REJECTED",
      approvalStatus:
        opportunity.approvalStatus === "Pending" ? "Rejected" : opportunity.approvalStatus,
      recommendation: {
        ...opportunity.recommendation,
        pillowRecommendation: "DO NOT APPROVE",
        fullNarrative: `${input.dossierSummary ?? input.reason}\n\nRE-EVALUATION REJECT: ${input.reason}`,
      },
      dossier: input.dossier ?? opportunity.dossier,
      risks: [...opportunity.risks, input.reason],
      publicationAllowed: false,
      supplierSpendAllowed: false,
      updatedAt: now,
    };
    repo.updateOpportunity(opportunity);
  }

  captureInstitutionalMemory({
    workspaceId: input.input.workspaceId,
    canonicalKey: `commerce.reeval.reject.${input.target.asin}.${input.target.cjPid}`,
    title: `Pillow re-eval REJECT ${input.target.asin}`,
    statement: input.reason,
    memoryClass: "commerce",
    authority: "pillow_recommendation",
    epistemicStatus: "OUTCOME",
    source: "commerce_event",
    tags: ["commerce", "reevaluation", "rejection", input.reasonCode.toLowerCase()],
    evidenceRefs: [
      `asin:${input.target.asin}`,
      `cjPid:${input.target.cjPid}`,
      input.reasonCode,
    ],
    linkedEntities: {
      asin: input.target.asin,
      cjPid: input.target.cjPid,
      amazonSellerSku: input.target.amazonSellerSku,
    },
    category: "C",
    actor: "pillow-commerce-presale",
  });

  return {
    reevaluatedAt: now,
    actorWasCursor: false,
    publicationAttempted: false,
    supplierSpendAttempted: false,
    target: input.target,
    outcome: "DOSSIER_REJECTED",
    opportunity,
    dossierSummary: input.dossierSummary ?? null,
    rejectReason: input.reason,
    rejectCode: input.reasonCode,
    operatingLoop: input.operatingLoop,
    nextPillowAction:
      "Autonomously discover and deep-analyse the next candidate. Do not ask Grand King to find another product.",
  };
}
