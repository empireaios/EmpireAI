import { randomUUID } from "node:crypto";

import type {
  ArbitrageAnalysis,
  CreativePackage,
  CtoLens,
  ExecutiveLens,
  MarketplaceStudy,
  ProductCandidate,
  ProductFitIntelligence,
  ProductLaunchMission,
  ProposalReadiness,
  SupplierIntelligence,
} from "../models/commerce-intelligence-core.js";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function resolveProposalReadiness(ceoLens: ExecutiveLens, ctoLens: CtoLens): ProposalReadiness {
  return ceoLens.passes && ctoLens.passes ? "READY" : "NOT_READY";
}

/** Builds approval-ready Product Launch Mission for Grand King visual review. */
export function buildProductLaunchMission(
  workspaceId: string,
  companyId: string,
  candidate: ProductCandidate,
  supplierIntelligence: SupplierIntelligence,
  study: MarketplaceStudy,
  arbitrage: ArbitrageAnalysis,
  fit: ProductFitIntelligence,
  creative: CreativePackage,
  ceoLens: ExecutiveLens,
  ctoLens: CtoLens,
): ProductLaunchMission {
  const now = new Date().toISOString();
  const proposalReadiness = resolveProposalReadiness(ceoLens, ctoLens);

  const commercialScore = clampScore(
    supplierIntelligence.viabilityScore * 0.15 +
      study.marketplaceFitScore * 0.2 +
      arbitrage.arbitrageScore * 0.25 +
      fit.productFitScore * 0.2 +
      ceoLens.overallScore * 0.1 +
      ctoLens.overallScore * 0.1,
  );

  const confidenceScore = clampScore(
    commercialScore * 0.6 + (proposalReadiness === "READY" ? 25 : 5),
  );

  const netProfit = arbitrage.estimatedNetProfitUsd;
  const expectedNetProfitRangeUsd = {
    min: Math.round(netProfit * 0.7 * 100) / 100,
    max: Math.round(netProfit * 1.35 * 100) / 100,
  };

  const launchBudgetUsd = arbitrage.launchBudgetEstimateUsd;

  const keyRisks: string[] = [];
  if (arbitrage.downsideRisk !== "low") keyRisks.push(`Margin downside risk: ${arbitrage.downsideRisk}`);
  if (study.competitionDensity === "high") keyRisks.push("High competition density on Amazon US");
  if (study.reviewSaturation === "high") keyRisks.push("Review saturation may slow initial velocity");
  if (study.restrictionRisk !== "low") keyRisks.push(`Marketplace restriction risk: ${study.restrictionRisk}`);
  if (fit.refundRisk !== "low") keyRisks.push(`Refund risk: ${fit.refundRisk}`);
  if (supplierIntelligence.supplyRisk !== "low") keyRisks.push(`Supply risk: ${supplierIntelligence.supplyRisk}`);
  if (proposalReadiness === "NOT_READY") {
    keyRisks.push(
      !ceoLens.passes ? "CEO Lens failed — proposal not ready for Grand King approval" : "CTO Lens failed — technical remediation required",
    );
  }
  if (keyRisks.length === 0) keyRisks.push("Standard launch risk — monitor first 14 days post-publish");

  const whyEvidence = [
    ...ceoLens.evidence,
    ...ctoLens.evidence,
    ...study.listingQualityGaps.map((g) => `Gap: ${g}`),
    `Commercial score ${commercialScore}/100 · proposal ${proposalReadiness}`,
    `Supplier viability ${supplierIntelligence.viabilityScore}/100`,
    fit.buyerRationale,
  ];

  const recommendation =
    proposalReadiness === "NOT_READY"
      ? "NOT READY — resolve CEO/CTO lens blockers before Grand King approval"
      : confidenceScore >= 72
        ? "Recommend approval — strong margin, fit, and technical readiness"
        : confidenceScore >= 58
          ? "Recommend defer — gather additional marketplace validation"
          : "Recommend reject — fails commercial thresholds";

  return {
    missionId: randomUUID(),
    workspaceId,
    companyId,
    candidateId: candidate.candidateId,
    status: proposalReadiness === "READY" ? "pending_review" : "deferred",
    proposalReadiness,
    commercialScore,
    supplierId: "cj-dropshipping",
    marketplaceId: "amazon-us",
    route: fit.route,
    product: candidate,
    supplierIntelligence,
    marketplaceStudy: study,
    arbitrage,
    productFit: fit,
    creative,
    ceoLens,
    ctoLens,
    confidenceScore,
    expectedMarginPercent: arbitrage.estimatedNetMarginPercent,
    expectedNetProfitRangeUsd,
    launchBudgetUsd,
    keyRisks,
    whyThisProduct: `${candidate.title} delivers ${arbitrage.estimatedNetMarginPercent}% net margin · ${fit.buyerRationale}`,
    whyThisMarket: `Amazon US fit ${study.marketplaceFitScore}/100 · ${study.marketplaceRisk} marketplace risk · ${study.competitionDensity} competition`,
    whyNow: `Inventory ${candidate.inventoryTotal} units · ${fit.seasonality} · CJ reliability ${candidate.supplierReliabilityScore}/100`,
    recommendation,
    whyEvidence,
    kingApproved: false,
    intelligenceOwner: "pillow",
    createdAt: now,
    updatedAt: now,
  };
}
