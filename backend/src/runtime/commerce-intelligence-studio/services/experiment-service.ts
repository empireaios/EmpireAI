import { randomUUID } from "node:crypto";

import type { SupplierProductInput } from "../models/commercial-review.js";
import type { CommercialExperimentResult, ExperimentClassification } from "../models/commercial-experiment.js";
import { getCommercialReview } from "./commercial-review-service.js";
import { getCommercialStrategy } from "./commercial-strategy-service.js";
import { generateWinningListing } from "./winning-listing-service.js";
import { runCommercialReview } from "./commercial-review-service.js";
import { recommendCommercialStrategy } from "./commercial-strategy-service.js";
import { getCisRepository } from "../repositories/sqlite-cis-repository.js";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** CIS-004 — Experiment Engine. Expected business value drives decisions. */
export function classifyProductExperiment(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
): CommercialExperimentResult {
  const review = getCommercialReview(workspaceId, companyId, product.supplierProductId);
  const strategy = getCommercialStrategy(workspaceId, companyId, product.supplierProductId);

  const retail = product.suggestedRetailPrice ?? product.costPrice * 2.5;
  const margin = product.marginPercent ?? ((retail - product.costPrice) / retail) * 100;
  const reviewScore = review?.aggregateScore ?? 55;
  const strategyConfidence = strategy?.confidence ?? 50;
  const riskScore = review?.perspectives.find((p) => p.perspective === "risk")?.score ?? 60;

  const factors: CommercialExperimentResult["factors"] = [];

  let businessValue = reviewScore * 0.35 + strategyConfidence * 0.35 + riskScore * 0.2;
  if (margin >= 25) {
    factors.push({ factor: "Acceptable margin profile", impact: "positive", weight: 0.2 });
    businessValue += 5;
  } else if (margin >= 15) {
    factors.push({ factor: "Moderate margin — not disqualifying", impact: "neutral", weight: 0.15 });
  } else {
    factors.push({ factor: "Low margin — offset by strategy potential", impact: "neutral", weight: 0.1 });
  }

  if (product.shippingDays != null && product.shippingDays <= 10) {
    factors.push({ factor: "Fast shipping window", impact: "positive", weight: 0.15 });
    businessValue += 8;
  } else if (product.shippingDays != null && product.shippingDays <= 21) {
    factors.push({ factor: "Standard shipping — acceptable", impact: "neutral", weight: 0.1 });
  } else if (product.shippingDays != null) {
    factors.push({ factor: "Extended shipping — managed via messaging", impact: "neutral", weight: 0.05 });
  }

  if (reviewScore >= 75 && strategyConfidence >= 70 && riskScore >= 65) {
    factors.push({ factor: "Strong multi-perspective review", impact: "positive", weight: 0.25 });
    businessValue += 10;
  }

  if (product.imageUrls.length === 0) {
    factors.push({ factor: "Missing product imagery", impact: "negative", weight: 0.15 });
    businessValue -= 12;
  }

  const expectedBusinessValue = clamp(businessValue);

  let classification: ExperimentClassification;
  let explanation: string;

  if (expectedBusinessValue >= 75 && reviewScore >= 70 && riskScore >= 60) {
    classification = "HIGH_CONFIDENCE";
    explanation = `Strong commercial profile (value ${expectedBusinessValue}%) across review, strategy, and risk. Ready for controlled launch.`;
  } else if (expectedBusinessValue >= 55 && reviewScore >= 55) {
    classification = "EXPERIMENT";
    explanation = `Promising business value (${expectedBusinessValue}%) warrants limited inventory test. Shipping and margin alone do not disqualify.`;
  } else if (expectedBusinessValue >= 40 || reviewScore >= 50) {
    classification = "WATCHLIST";
    explanation = `Moderate potential (${expectedBusinessValue}%) — monitor supplier terms and market signals before committing.`;
  } else {
    classification = "REMOVE";
    explanation = `Low expected business value (${expectedBusinessValue}%) across multiple commercial dimensions. Recommend deprioritization — not based on shipping or margin alone.`;
  }

  const shippingNote = product.shippingDays != null
    ? `Shipping ${product.shippingDays} days noted — not used as sole rejection criterion.`
    : undefined;

  const marginNote = margin < 25
    ? `Margin ${margin.toFixed(0)}% is below ideal but not sole rejection criterion — strategy may compensate.`
    : undefined;

  const result: CommercialExperimentResult = {
    experimentId: randomUUID(),
    workspaceId,
    companyId,
    supplierProductId: product.supplierProductId,
    classification,
    expectedBusinessValue,
    explanation,
    factors,
    shippingDaysNote: shippingNote,
    marginNote: marginNote,
    confidence: clamp((review?.aggregateConfidence ?? 50) * 0.5 + strategyConfidence * 0.5),
    classifiedAt: new Date().toISOString(),
  };

  getCisRepository().saveExperiment(result);
  return result;
}

export function getProductExperiment(
  workspaceId: string,
  companyId: string,
  supplierProductId: string,
): CommercialExperimentResult | null {
  return getCisRepository().getLatestExperiment(workspaceId, companyId, supplierProductId);
}

export function listExperiments(workspaceId: string, companyId: string): CommercialExperimentResult[] {
  return getCisRepository().listExperiments(workspaceId, companyId);
}

/** Full CIS pipeline: review → strategy → experiment → winning listing. */
export function runFullCommercialIntelligence(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
  brandName: string,
) {
  const review = runCommercialReview(workspaceId, companyId, product);
  const strategy = recommendCommercialStrategy(workspaceId, companyId, product);
  const experiment = classifyProductExperiment(workspaceId, companyId, product);
  const listing = generateWinningListing(workspaceId, companyId, product, {
    supplierProductId: product.supplierProductId,
    brandName,
    tone: "professional",
  });

  return { review, strategy, experiment, listing };
}
