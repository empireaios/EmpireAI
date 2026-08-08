import { randomUUID } from "node:crypto";

import { logger } from "../../../config/logger.js";
import type { ApprovalGateEngine } from "../../pillow-approval/approval-gate-engine.js";
import { createCjApiClient } from "../../../suppliers/cj-dropshipping/cj-api-client.js";
import { loadCjConfig, isCjLiveApiEnabled } from "../../../suppliers/cj-dropshipping/cj-config.js";
import type { CjProduct } from "../../../suppliers/cj-dropshipping/cj-types.js";
import {
  estimateAmazonFees,
  getListingsRestrictions,
  isProof001FailureClass,
  openAmazonUsSession,
  searchCatalogAsin,
} from "../amazon-commerce-preflight.js";
import {
  pickLiveCjVariant,
  coerceUsdNumber,
  mergeCjVariantQueryIntoProduct,
  summarizeCjPriceFields,
} from "../cj-live-normalize.js";
import { calculateExpectedContribution, proposeSellingPrice } from "../economics.js";
import {
  DEFAULT_START_QUANTITY,
  STANDING_COMMERCE_OBJECTIVE,
  formatMoneyEvidence,
  type CandidateRejection,
  type ExecutiveRecommendation,
  type MoneyEvidence,
  type PresaleCycleResult,
  type QualifiedOpportunity,
} from "../models.js";
import { getPillowCommercePresaleRepository } from "../repository/sqlite-pillow-commerce-presale-repository.js";

export type RunPresaleCycleInput = {
  workspaceId: string;
  companyId: string;
  initiatedBy: PresaleCycleResult["initiatedBy"];
  maxCandidates?: number;
  approvalGate?: ApprovalGateEngine | null;
  env?: NodeJS.ProcessEnv;
  /** Injected fetch for tests. */
  fetchImpl?: typeof fetch;
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
    for (const key of [
      "inventory",
      "totalInventoryNum",
      "cjInventoryNum",
      "storageNum",
      "factoryInventoryNum",
    ]) {
      const n = r[key];
      if (typeof n === "number" && Number.isFinite(n) && n > total) total = n;
    }
    const warehouses = r.warehouseInventory;
    if (Array.isArray(warehouses)) {
      for (const w of warehouses) {
        if (!w || typeof w !== "object") continue;
        const inv = (w as { inventory?: number }).inventory;
        if (typeof inv === "number" && Number.isFinite(inv)) total += inv;
      }
    }
  }
  return total;
}

async function fetchLiveStockUnits(
  cj: ReturnType<typeof createCjApiClient>,
  variant: { vid: string; sku: string; inventory?: number },
): Promise<{ units: number; source: string }> {
  if (typeof variant.inventory === "number" && variant.inventory > 0) {
    return { units: variant.inventory, source: "cj.variant.inventory" };
  }
  try {
    const byVid = await cj.queryStockByVid(variant.vid);
    const units = sumStock(byVid.data);
    if (units > 0) return { units, source: "cj.stock.queryByVid" };
  } catch {
    /* try sku */
  }
  try {
    const bySku = await cj.queryStockBySku(variant.sku);
    const units = sumStock(bySku.data);
    if (units > 0) return { units, source: "cj.stock.queryBySku" };
  } catch {
    /* try legacy pid path only as last resort */
  }
  return { units: 0, source: "unavailable" };
}

function buildRecommendation(input: {
  productName: string;
  asin: string;
  stockUnits: number;
  cost: MoneyEvidence;
  shipping: MoneyEvidence;
  fees: MoneyEvidence;
  price: number;
  profit: number;
  margin: number;
  risks: string[];
  amazonSellerSku: string;
  cjPid: string;
  cjVid: string;
}): ExecutiveRecommendation {
  const riskSummary = input.risks.length ? input.risks.join("; ") : "No preflight blockers detected";
  const fullNarrative = [
    "COMMERCE OPPORTUNITY — APPROVAL REQUIRED",
    "",
    `Product: ${input.productName}`,
    `Amazon US: eligible/preflight clear for ASIN ${input.asin} (NOT yet published; NOT claimed BUYABLE)`,
    "Supplier: CJdropshipping",
    `Supplier stock: ${input.stockUnits} units [LIVE]`,
    `Supplier cost: ${formatMoneyEvidence(input.cost)}`,
    `US shipping: ${formatMoneyEvidence(input.shipping)}`,
    `Amazon fees: ${formatMoneyEvidence(input.fees)}`,
    `Proposed selling price: $${input.price.toFixed(2)}`,
    `Expected profit: $${input.profit.toFixed(2)}`,
    `Expected margin: ${input.margin.toFixed(2)}%`,
    `Risk: ${riskSummary}`,
    "Pillow recommendation: APPROVE",
    "Proposed action after approval: Build LISTING_OFFER_ONLY package with persisted Amazon↔CJ map, then publish only after explicit Grand King approval confirmation — no spend before approval.",
    "",
    `Identity: Amazon SKU ${input.amazonSellerSku} ↔ CJ PID ${input.cjPid} / VID ${input.cjVid}`,
  ].join("\n");

  return {
    headline: "COMMERCE OPPORTUNITY — APPROVAL REQUIRED",
    productName: input.productName,
    amazonUsEligibility: `Preflight clear for ASIN ${input.asin} (NOT published; NOT BUYABLE yet)`,
    supplier: "CJdropshipping",
    supplierStock: `${input.stockUnits} units [LIVE]`,
    supplierCost: formatMoneyEvidence(input.cost),
    usShipping: formatMoneyEvidence(input.shipping),
    amazonFees: formatMoneyEvidence(input.fees),
    proposedSellingPrice: `$${input.price.toFixed(2)}`,
    expectedProfit: `$${input.profit.toFixed(2)}`,
    expectedMargin: `${input.margin.toFixed(2)}%`,
    riskSummary,
    pillowRecommendation: "APPROVE",
    proposedActionAfterApproval:
      "Publish LISTING_OFFER_ONLY using persisted Amazon↔CJ map; verify BUYABLE after publish; no supplier spend until a real Amazon order + separate approval.",
    fullNarrative,
  };
}

export async function runPillowCommercePresaleCycle(
  input: RunPresaleCycleInput,
): Promise<PresaleCycleResult> {
  const env = input.env ?? process.env;
  const repo = getPillowCommercePresaleRepository();
  const cycleId = randomUUID();
  const startedAt = new Date().toISOString();
  const maxCandidates = input.maxCandidates ?? 8;
  const blockers: string[] = [];
  const rejections: CandidateRejection[] = [];

  const pending = repo.getPendingApprovalOpportunity(input.workspaceId);
  if (pending) {
    const cycle: PresaleCycleResult = {
      cycleId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      initiatedBy: input.initiatedBy,
      standingObjective: STANDING_COMMERCE_OBJECTIVE,
      startedAt,
      completedAt: new Date().toISOString(),
      candidatesRetrieved: 0,
      rejections: [],
      qualifiedOpportunity: pending,
      outcome: "ALREADY_PENDING_APPROVAL",
      blockers: ["Pending Grand King approval already exists — not creating duplicate recommendation"],
      publicationAttempted: false,
      supplierSpendAttempted: false,
      actorWasCursor: false,
    };
    repo.saveCycle(cycle);
    return cycle;
  }

  const cjConfig = loadCjConfig(env);
  if (!isCjLiveApiEnabled(cjConfig)) {
    blockers.push("CJ LIVE credentials/mode not enabled — cannot retrieve live supplier opportunities");
    const cycle: PresaleCycleResult = {
      cycleId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      initiatedBy: input.initiatedBy,
      standingObjective: STANDING_COMMERCE_OBJECTIVE,
      startedAt,
      completedAt: new Date().toISOString(),
      candidatesRetrieved: 0,
      rejections,
      qualifiedOpportunity: null,
      outcome: "BLOCKED_INTEGRATION",
      blockers,
      publicationAttempted: false,
      supplierSpendAttempted: false,
      actorWasCursor: false,
    };
    repo.saveCycle(cycle);
    return cycle;
  }

  const amazon = await openAmazonUsSession(env);
  if (!amazon.session) {
    blockers.push(amazon.blocker ?? "Amazon session unavailable");
    const cycle: PresaleCycleResult = {
      cycleId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      initiatedBy: input.initiatedBy,
      standingObjective: STANDING_COMMERCE_OBJECTIVE,
      startedAt,
      completedAt: new Date().toISOString(),
      candidatesRetrieved: 0,
      rejections,
      qualifiedOpportunity: null,
      outcome: "BLOCKED_INTEGRATION",
      blockers,
      publicationAttempted: false,
      supplierSpendAttempted: false,
      actorWasCursor: false,
    };
    repo.saveCycle(cycle);
    return cycle;
  }

  const cj = createCjApiClient(cjConfig, input.fetchImpl ?? fetch);
  let products: CjProduct[] = [];
  try {
    const list = await cj.listProducts({ pageNum: 1, pageSize: maxCandidates });
    products = list.data?.list ?? [];
  } catch (error) {
    blockers.push(
      `CJ product list failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    const cycle: PresaleCycleResult = {
      cycleId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      initiatedBy: input.initiatedBy,
      standingObjective: STANDING_COMMERCE_OBJECTIVE,
      startedAt,
      completedAt: new Date().toISOString(),
      candidatesRetrieved: 0,
      rejections,
      qualifiedOpportunity: null,
      outcome: "BLOCKED_INTEGRATION",
      blockers,
      publicationAttempted: false,
      supplierSpendAttempted: false,
      actorWasCursor: false,
    };
    repo.saveCycle(cycle);
    return cycle;
  }

  let qualified: QualifiedOpportunity | null = null;

  for (const product of products.slice(0, maxCandidates)) {
    const productName = product.productNameEn || product.productName || product.pid;

    if (isProof001FailureClass({ productName, asin: null })) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "PROOF_001_BRAND_FAILURE_CLASS",
        reason: "Rejected: brand/title matches Proof 001 Anker failure class",
      });
      continue;
    }

    let detail = product;
    try {
      const queried = await cj.queryProduct(product.pid);
      if (queried.data) detail = queried.data;
    } catch {
      /* list payload may still be usable */
    }

    let picked = pickLiveCjVariant(detail);
    if (picked.costUsd === null) {
      try {
        const variantQuery = await cj.queryProductVariants(product.pid);
        detail = mergeCjVariantQueryIntoProduct(detail, variantQuery.data);
        picked = pickLiveCjVariant(detail);
      } catch {
        /* keep prior pick */
      }
    }

    const variant = picked.variant;
    const costAmount = picked.costUsd;
    if (!variant?.vid) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "INCOMPLETE_IDENTITY",
        reason: "No CJ variant identity (vid) available",
        evidence: summarizeCjPriceFields(detail),
      });
      continue;
    }
    if (costAmount === null) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "COST_UNAVAILABLE",
        reason: "Live supplier cost UNAVAILABLE — refusing static heuristic",
        evidence: summarizeCjPriceFields(detail),
      });
      continue;
    }

    let stockUnits = 0;
    try {
      const stock = await cj.queryStockByPid(product.pid);
      stockUnits = sumStock(stock.data);
    } catch (error) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "OUT_OF_STOCK",
        reason: `Stock query failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }
    if (stockUnits <= 0) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "OUT_OF_STOCK",
        reason: "Live stock is 0 — not approval-ready",
        evidence: { stockUnits },
      });
      continue;
    }

    let shippingAmount: number | null = null;
    try {
      const freight = await cj.calculateFreight({
        startCountryCode: "CN",
        endCountryCode: "US",
        products: [{ quantity: 1, vid: variant.vid }],
      });
      const options = freight.data ?? [];
      const priced = options
        .map((o) => o.logisticPrice)
        .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
      if (priced.length > 0) shippingAmount = Math.min(...priced);
    } catch (error) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "FREIGHT_UNAVAILABLE",
        reason: `US freight failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }
    if (shippingAmount === null) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "FREIGHT_UNAVAILABLE",
        reason: "No US freight options returned",
      });
      continue;
    }

    const asinResult = await searchCatalogAsin(amazon.session, productName);
    if (!asinResult.asin) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "NO_AMAZON_ASIN",
        reason: asinResult.blocker ?? "No Amazon ASIN",
      });
      continue;
    }

    if (
      isProof001FailureClass({
        asin: asinResult.asin,
        productName,
      })
    ) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "PROOF_001_BRAND_FAILURE_CLASS",
        reason: `Rejected ASIN ${asinResult.asin} — Proof 001 failure class`,
        evidence: { asin: asinResult.asin },
      });
      continue;
    }

    const restrictions = await getListingsRestrictions(amazon.session, asinResult.asin);
    if (restrictions.restricted) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: restrictions.qualificationRequired
          ? "QUALIFICATION_REQUIRED"
          : "AMAZON_RESTRICTION",
        reason: `Amazon restriction preflight blocked: ${restrictions.reasons.join(" | ") || "restricted"}`,
        evidence: { asin: asinResult.asin, reasons: restrictions.reasons },
      });
      continue;
    }

    let price = proposeSellingPrice({
      supplierCostUsd: costAmount,
      shippingUsd: shippingAmount,
      suggestSellPriceUsd:
        coerceUsdNumber(variant.suggestSellPrice) ?? coerceUsdNumber(detail.suggestSellPrice),
    });

    let fees = await estimateAmazonFees(amazon.session, asinResult.asin, price);
    if (fees.totalFeesUsd === null) {
      // One price bump retry in case fee API needs a higher listing amount
      price = Number((price * 1.2).toFixed(2));
      fees = await estimateAmazonFees(amazon.session, asinResult.asin, price);
    }
    if (fees.totalFeesUsd === null) {
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "FEE_UNAVAILABLE",
        reason: fees.blocker ?? "Amazon fee estimate UNAVAILABLE",
        evidence: { asin: asinResult.asin, price },
      });
      continue;
    }

    // Refine price once with live fee awareness
    const refined = proposeSellingPrice({
      supplierCostUsd: costAmount,
      shippingUsd: shippingAmount,
      suggestSellPriceUsd:
        coerceUsdNumber(variant.suggestSellPrice) ?? coerceUsdNumber(detail.suggestSellPrice),
      feeGuessUsd: fees.totalFeesUsd,
    });
    if (refined > price) {
      price = refined;
      fees = await estimateAmazonFees(amazon.session, asinResult.asin, price);
      if (fees.totalFeesUsd === null) {
        rejections.push({
          cjPid: product.pid,
          productName,
          reasonCode: "FEE_UNAVAILABLE",
          reason: fees.blocker ?? "Amazon fee estimate UNAVAILABLE after refine",
        });
        continue;
      }
    }

    const costEv: MoneyEvidence = {
      amountUsd: costAmount,
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
      rejections.push({
        cjPid: product.pid,
        productName,
        reasonCode: "LOSS_MAKING",
        reason: economics.blocker ?? "Failed profit gate",
        evidence: {
          price,
          fees: fees.totalFeesUsd,
          cost: costAmount,
          shipping: shippingAmount,
          profit: economics.expectedProfitUsd,
        },
      });
      continue;
    }

    const amazonSellerSku = `EMP-FD-${Date.now().toString(36).toUpperCase()}`;
    const risks = [
      "Offer not yet published — BUYABLE must be verified after publication",
      "Catalog ASIN match is keyword-based; verify product fit before approval",
      `Starting quantity limited to ${DEFAULT_START_QUANTITY} for exposure control`,
    ];

    const recommendation = buildRecommendation({
      productName,
      asin: asinResult.asin,
      stockUnits,
      cost: costEv,
      shipping: shipEv,
      fees: feeEv,
      price,
      profit: economics.expectedProfitUsd,
      margin: economics.expectedMarginPct ?? 0,
      risks,
      amazonSellerSku,
      cjPid: product.pid,
      cjVid: variant.vid,
    });

    const now = new Date().toISOString();
    const mapping = {
      marketplaceId: amazon.session.marketplaceId,
      asin: asinResult.asin,
      amazonSellerSku,
      cjPid: product.pid,
      cjVid: variant.vid,
      cjVariantSku: variant.sku || variant.vid,
      supplierCostUsd: costEv,
      shippingUsd: shipEv,
      amazonFeesUsd: feeEv,
      proposedSellingPriceUsd: price,
      expectedProfitUsd: economics.expectedProfitUsd,
      expectedMarginPct: economics.expectedMarginPct ?? 0,
      startQuantity: DEFAULT_START_QUANTITY,
      verifiedAt: now,
    };

    let approvalId: string | null = null;
    if (input.approvalGate) {
      try {
        const approval = input.approvalGate.register({
          workspaceId: input.workspaceId,
          type: "runtime_operation",
          requestedBy: "pillow-commerce-presale",
          correlationId: cycleId,
          proposal: {
            title: recommendation.headline,
            summary: recommendation.fullNarrative,
            ownerRoute: "/cockpit/commerce/workspace",
            evidence: [
              `asin:${mapping.asin}`,
              `cjPid:${mapping.cjPid}`,
              `expectedProfitUsd:${mapping.expectedProfitUsd}`,
              "publicationAttempted:false",
              "supplierSpendAttempted:false",
            ],
            metadata: {
              opportunityKind: "first_dollar_presale",
              amazonSellerSku: mapping.amazonSellerSku,
              asin: mapping.asin,
              cjPid: mapping.cjPid,
              cjVid: mapping.cjVid,
              standingObjective: STANDING_COMMERCE_OBJECTIVE,
              publicationAllowed: false,
              supplierSpendAllowed: false,
            },
          },
        });
        approvalId = approval.approvalId;
      } catch (error) {
        blockers.push(
          `Approval registration failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      blockers.push("ApprovalGate unavailable at cycle time — opportunity stored; gate will be required before publish");
    }

    qualified = {
      opportunityId: randomUUID(),
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      disposition: approvalId ? "AWAITING_APPROVAL" : "APPROVAL_READY",
      preflightOfferState: "NOT_PUBLISHED",
      mapping,
      stockUnits,
      stockFreshness: "LIVE",
      risks,
      recommendation,
      approvalId,
      approvalStatus: approvalId ? "Pending" : "none",
      publicationAllowed: false,
      supplierSpendAllowed: false,
      createdAt: now,
      updatedAt: now,
    };

    repo.saveMapping(mapping, input.workspaceId);
    repo.saveOpportunity(qualified);
    break;
  }

  const cycle: PresaleCycleResult = {
    cycleId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    initiatedBy: input.initiatedBy,
    standingObjective: STANDING_COMMERCE_OBJECTIVE,
    startedAt,
    completedAt: new Date().toISOString(),
    candidatesRetrieved: products.length,
    rejections,
    qualifiedOpportunity: qualified,
    outcome: qualified
      ? "APPROVAL_SURFACED"
      : blockers.length
        ? "BLOCKED_INTEGRATION"
        : "NO_QUALIFIED_OPPORTUNITY",
    blockers,
    publicationAttempted: false,
    supplierSpendAttempted: false,
    actorWasCursor: false,
  };

  repo.saveCycle(cycle);
  logger.info(
    {
      cycleId,
      outcome: cycle.outcome,
      retrieved: cycle.candidatesRetrieved,
      rejected: rejections.length,
      approvalId: qualified?.approvalId ?? null,
    },
    "Pillow commerce pre-sale cycle completed",
  );
  return cycle;
}

export function applyOwnerDecisionToOpportunity(input: {
  workspaceId: string;
  opportunityId: string;
  outcome: "Approved" | "Rejected" | "Cancelled";
}): QualifiedOpportunity | null {
  const repo = getPillowCommercePresaleRepository();
  const latest = repo.getLatestOpportunity(input.workspaceId);
  if (!latest || latest.opportunityId !== input.opportunityId) return null;

  const updated: QualifiedOpportunity = {
    ...latest,
    approvalStatus: input.outcome === "Approved" ? "Approved" : input.outcome === "Rejected" ? "Rejected" : "Cancelled",
    disposition:
      input.outcome === "Approved"
        ? "APPROVED_PENDING_PUBLISH"
        : "REJECTED_BY_OWNER",
    publicationAllowed: false,
    supplierSpendAllowed: false,
    updatedAt: new Date().toISOString(),
    recommendation: {
      ...latest.recommendation,
      pillowRecommendation:
        input.outcome === "Approved"
          ? latest.recommendation.pillowRecommendation
          : "DO NOT APPROVE",
    },
  };
  // Owner approval does NOT auto-publish in this mission.
  repo.updateOpportunity(updated);
  return updated;
}
