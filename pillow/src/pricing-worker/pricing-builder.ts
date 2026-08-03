import type { PricingWorkerConfiguration } from "./configuration.js";
import {
  PRW_METADATA_VERSION,
  PRICING_REPORT_VERSION,
  PRICING_WORKER_IDENTITY,
} from "./paths.js";
import type {
  ApprovedProductPricingInput,
  CompetitorPricePoint,
  CostKind,
  CostLine,
  EvidenceItem,
  IntegrationHandshake,
  MarketplaceTarget,
  PricingReport,
  PricingWorkerCatalog,
  PricingWorkerInput,
} from "./types.js";

/** Pure Pricing Worker helpers for Q3-09 — recommendation only. */
export class PricingBuilder {
  buildCatalog(
    config: PricingWorkerConfiguration,
    pricingReports: PricingReport[],
    integrations: IntegrationHandshake[],
  ): PricingWorkerCatalog {
    return {
      reportVersion: PRICING_REPORT_VERSION,
      workerId: config.workerId,
      pricingReports: pricingReports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: PRW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPublishListings: true,
      neverModifySupplierCosts: true,
      neverExecutePromotions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverPublishPricingAutomatically: true,
    };
  }

  resolveProduct(input: PricingWorkerInput): ApprovedProductPricingInput {
    const base = input.approvedProduct ?? {};
    return {
      productId: input.productId ?? base.productId,
      productName: input.productName ?? base.productName,
      marketplace: input.marketplace ?? base.marketplace,
      listingId: input.listingId ?? base.listingId,
      supplierId: input.supplierId ?? base.supplierId,
      supplierName: input.supplierName ?? base.supplierName,
      supplierCost: input.supplierCost ?? base.supplierCost,
      supplierCostKind: input.supplierCostKind ?? base.supplierCostKind,
      shippingCost: input.shippingCost ?? base.shippingCost,
      shippingCostKind: input.shippingCostKind ?? base.shippingCostKind,
      currency: input.currency ?? base.currency,
      competitorPrices: input.competitorPrices ?? base.competitorPrices,
      evaluationId: input.evaluationId ?? base.evaluationId,
      discoveryId: input.discoveryId ?? base.discoveryId,
      businessMissionId: input.businessMissionId ?? base.businessMissionId,
    };
  }

  resolveMarketplace(
    product: ApprovedProductPricingInput,
    config: PricingWorkerConfiguration,
  ): MarketplaceTarget {
    const raw = String(product.marketplace ?? config.marketplaceTargets[0] ?? "generic")
      .trim()
      .toLowerCase();
    if (raw === "amazon" || raw === "shopify" || raw === "ebay" || raw === "generic") {
      return raw;
    }
    return "generic";
  }

  buildReport(
    input: PricingWorkerInput,
    config: PricingWorkerConfiguration,
    product: ApprovedProductPricingInput,
  ): PricingReport {
    pricingSequence += 1;
    const now = new Date().toISOString();
    const marketplace = this.resolveMarketplace(product, config);
    const currency = product.currency?.trim() || config.currency || "USD";
    const productId = product.productId?.trim() || `prod-pricing-${pricingSequence}`;
    const productName = product.productName?.trim() || `Product ${pricingSequence}`;

    const supplierCost = this.costLine(
      product.supplierCost ?? 0,
      this.costKind(product.supplierCostKind, product.supplierCost != null ? "actual" : "estimated"),
      currency,
      product.supplierCost != null
        ? "Supplier unit cost from approved cost input"
        : "Supplier unit cost missing — estimated at 0 pending cost receipt",
    );
    const shippingCost = this.costLine(
      product.shippingCost ?? config.defaultShippingCost,
      this.costKind(
        product.shippingCostKind,
        product.shippingCost != null ? "actual" : "estimated",
      ),
      currency,
      product.shippingCost != null
        ? "Inbound/outbound shipping cost from input"
        : `Estimated shipping default ${config.defaultShippingCost}`,
    );

    const targetMargin =
      input.targetMarginPercent ?? config.defaultTargetMarginPercent;
    const marketplaceFeePercent =
      input.marketplaceFeePercent ?? config.defaultMarketplaceFeePercent;
    const paymentFeePercent = input.paymentFeePercent ?? config.defaultPaymentFeePercent;
    const advertisingPercent = input.advertisingPercent ?? config.defaultAdvertisingPercent;

    // Base before percentage fees: supplier + shipping
    const baseCost = round(supplierCost.amount + shippingCost.amount);

    // Solve selling price so that after fee% and ad% and margin target we cover base:
    // price = base / (1 - fee% - payment% - ad% - margin%)
    const feeFraction = marketplaceFeePercent / 100;
    const paymentFraction = paymentFeePercent / 100;
    const adFraction = advertisingPercent / 100;
    const marginFraction = targetMargin / 100;
    const retained = 1 - feeFraction - paymentFraction - adFraction - marginFraction;
    const recommendedSellingPrice =
      retained > 0.05 ? round(baseCost / retained) : round(baseCost * 2.5);

    const marketplaceFees = this.costLine(
      round(recommendedSellingPrice * feeFraction),
      "estimated",
      currency,
      `Marketplace fee assumption ${marketplaceFeePercent}% of selling price`,
    );
    const paymentFees = this.costLine(
      round(recommendedSellingPrice * paymentFraction),
      "estimated",
      currency,
      `Payment processing fee assumption ${paymentFeePercent}% of selling price`,
    );
    const advertisingAllocation = this.costLine(
      round(recommendedSellingPrice * adFraction),
      "estimated",
      currency,
      `Advertising allocation assumption ${advertisingPercent}% of selling price`,
    );
    const totalLandedCost = this.costLine(
      round(
        supplierCost.amount +
          shippingCost.amount +
          marketplaceFees.amount +
          paymentFees.amount +
          advertisingAllocation.amount,
      ),
      this.mixedKind([
        supplierCost.kind,
        shippingCost.kind,
        marketplaceFees.kind,
        paymentFees.kind,
        advertisingAllocation.kind,
      ]),
      currency,
      "Total landed cost = supplier + shipping + marketplace fees + payment fees + advertising allocation",
    );
    const targetProfit = this.costLine(
      round(recommendedSellingPrice - totalLandedCost.amount),
      "estimated",
      currency,
      `Target profit at ${targetMargin}% margin objective`,
    );

    const competitorPricing = (product.competitorPrices ?? []).map((c) => ({
      competitorId: c.competitorId?.trim() || `comp-${pricingSequence}`,
      competitorName: c.competitorName?.trim() || "Competitor",
      price: Number(c.price ?? 0),
      currency: c.currency?.trim() || currency,
      source: c.source?.trim() || "provided",
      kind: this.costKind(c.kind, "estimated"),
    }));

    const pricingRationale = this.buildRationale(
      productName,
      marketplace,
      supplierCost,
      shippingCost,
      marketplaceFees,
      paymentFees,
      advertisingAllocation,
      totalLandedCost,
      targetMargin,
      targetProfit,
      recommendedSellingPrice,
      competitorPricing,
    );

    const actualCostTotal = round(
      [supplierCost, shippingCost]
        .filter((c) => c.kind === "actual")
        .reduce((sum, c) => sum + c.amount, 0),
    );
    const estimatedCostTotal = round(
      [supplierCost, shippingCost, marketplaceFees, paymentFees, advertisingAllocation]
        .filter((c) => c.kind === "estimated")
        .reduce((sum, c) => sum + c.amount, 0),
    );

    const evidence = this.compileEvidence(
      product,
      supplierCost,
      shippingCost,
      totalLandedCost,
      recommendedSellingPrice,
      competitorPricing,
      input,
      now,
    );
    const confidenceScore = this.scoreConfidence(
      product,
      supplierCost,
      shippingCost,
      competitorPricing,
      evidence,
    );

    return {
      pricingId: input.pricingId?.trim() || `prw-prc-${Date.now()}-${pricingSequence}`,
      timestamp: now,
      productId,
      productName,
      marketplace,
      listingId: product.listingId?.trim() || null,
      supplierId: product.supplierId?.trim() || null,
      supplierName: product.supplierName?.trim() || null,
      supplierCost,
      shippingCost,
      marketplaceFees,
      paymentFees,
      advertisingAllocation,
      totalLandedCost,
      targetMargin: Number(targetMargin.toFixed(2)),
      targetProfit,
      competitorPricing,
      recommendedSellingPrice,
      pricingRationale,
      confidenceScore,
      actualCostTotal,
      estimatedCostTotal,
      currency,
      evaluationId: product.evaluationId?.trim() || null,
      discoveryId: product.discoveryId?.trim() || null,
      supportingEvidence: evidence,
      businessMissionId: product.businessMissionId?.trim() || null,
      metadataVersion: PRW_METADATA_VERSION,
      reportVersion: PRICING_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || PRICING_WORKER_IDENTITY.workerId,
      neverPublishListings: true,
      neverModifySupplierCosts: true,
      neverExecutePromotions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ310OrLater: true,
      neverPublishPricingAutomatically: true,
      preservePricingTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  costLine(amount: number, kind: CostKind, currency: string, note: string): CostLine {
    return {
      amount: round(Math.max(0, amount)),
      kind,
      currency,
      note,
    };
  }

  costKind(value: unknown, fallback: CostKind): CostKind {
    return value === "actual" || value === "estimated" ? value : fallback;
  }

  mixedKind(kinds: CostKind[]): CostKind {
    return kinds.every((k) => k === "actual") ? "actual" : "estimated";
  }

  buildRationale(
    productName: string,
    marketplace: MarketplaceTarget,
    supplierCost: CostLine,
    shippingCost: CostLine,
    marketplaceFees: CostLine,
    paymentFees: CostLine,
    advertisingAllocation: CostLine,
    totalLandedCost: CostLine,
    targetMargin: number,
    targetProfit: CostLine,
    recommendedSellingPrice: number,
    competitors: CompetitorPricePoint[],
  ): string {
    const competitorNote = competitors.length
      ? ` Competitor range ${Math.min(...competitors.map((c) => c.price))}–${Math.max(...competitors.map((c) => c.price))} ${competitors[0]?.currency ?? ""}.`
      : " No competitor prices supplied; recommendation driven by cost and margin targets.";
    return [
      `Recommended selling price ${recommendedSellingPrice} for ${productName} on ${marketplace}.`,
      `Supplier cost ${supplierCost.amount} (${supplierCost.kind}) + shipping ${shippingCost.amount} (${shippingCost.kind}).`,
      `Estimated marketplace fees ${marketplaceFees.amount}, payment fees ${paymentFees.amount}, advertising ${advertisingAllocation.amount}.`,
      `Total landed cost ${totalLandedCost.amount} (${totalLandedCost.kind}).`,
      `Target margin ${targetMargin}% yields target profit ${targetProfit.amount}.`,
      competitorNote.trim(),
      "Pricing is a recommendation only and is not published automatically.",
    ].join(" ");
  }

  compileEvidence(
    product: ApprovedProductPricingInput,
    supplierCost: CostLine,
    shippingCost: CostLine,
    totalLandedCost: CostLine,
    recommendedSellingPrice: number,
    competitors: CompetitorPricePoint[],
    input: PricingWorkerInput,
    now: string,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    const add = (
      source: string,
      claim: string,
      kind: EvidenceItem["kind"],
      relatedTopic: string,
    ) => {
      seq += 1;
      items.push({
        evidenceId: `ev-${seq}`,
        source,
        claim,
        kind,
        relatedTopic,
        recordedAt: now,
      });
    };

    for (const raw of input.evidenceSources ?? []) {
      const claim = raw.claim?.trim();
      if (!claim) continue;
      add(
        raw.source?.trim() || "provided_source",
        claim,
        raw.kind === "fact" ? "fact" : "assumption",
        raw.relatedTopic?.trim() || "general",
      );
    }
    add(
      "approved_product",
      `Pricing prepared for ${product.productName ?? product.productId ?? "unknown product"}`,
      "fact",
      "product",
    );
    add(
      "supplier_cost",
      `Supplier cost ${supplierCost.amount} marked ${supplierCost.kind}`,
      supplierCost.kind === "actual" ? "fact" : "assumption",
      "cost",
    );
    add(
      "shipping_cost",
      `Shipping cost ${shippingCost.amount} marked ${shippingCost.kind}`,
      shippingCost.kind === "actual" ? "fact" : "assumption",
      "cost",
    );
    add(
      "landed_cost",
      `Total landed cost ${totalLandedCost.amount} (${totalLandedCost.kind})`,
      totalLandedCost.kind === "actual" ? "fact" : "assumption",
      "cost",
    );
    add(
      "recommended_price",
      `Recommended selling price ${recommendedSellingPrice}`,
      "assumption",
      "price",
    );
    if (product.listingId) {
      add(
        "product_listing_worker",
        `Traceable to Product Listing ${product.listingId}`,
        "fact",
        "traceability",
      );
    }
    if (product.supplierId) {
      add(
        "supplier_reference",
        `Supplier reference preserved: ${product.supplierId}`,
        "fact",
        "traceability",
      );
    }
    for (const competitor of competitors.slice(0, 3)) {
      add(
        "competitor_pricing",
        `${competitor.competitorName}: ${competitor.price} (${competitor.kind})`,
        competitor.kind === "actual" ? "fact" : "assumption",
        "competition",
      );
    }
    add(
      "boundary",
      "Recommendation-only: does not publish listings/pricing, modify supplier costs, or execute promotions",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    product: ApprovedProductPricingInput,
    supplierCost: CostLine,
    shippingCost: CostLine,
    competitors: CompetitorPricePoint[],
    evidence: EvidenceItem[],
  ): number {
    let score = 0.35;
    if (product.productId?.trim()) score += 0.05;
    if (supplierCost.kind === "actual" && supplierCost.amount > 0) score += 0.15;
    if (shippingCost.kind === "actual") score += 0.1;
    if (competitors.length >= 1) score += 0.1;
    if (competitors.some((c) => c.kind === "actual")) score += 0.05;
    if (product.listingId) score += 0.05;
    score += Math.min(0.15, evidence.filter((e) => e.kind === "fact").length * 0.03);
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let pricingSequence = 0;

export function resetPricingSequenceForTesting() {
  pricingSequence = 0;
}

function round(value: number): number {
  return Number(Math.max(0, value).toFixed(2));
}

function cloneReport(report: PricingReport): PricingReport {
  return {
    ...report,
    supplierCost: { ...report.supplierCost },
    shippingCost: { ...report.shippingCost },
    marketplaceFees: { ...report.marketplaceFees },
    paymentFees: { ...report.paymentFees },
    advertisingAllocation: { ...report.advertisingAllocation },
    totalLandedCost: { ...report.totalLandedCost },
    targetProfit: { ...report.targetProfit },
    competitorPricing: report.competitorPricing.map((c) => ({ ...c })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
