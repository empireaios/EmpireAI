import { randomUUID } from "node:crypto";

import type {
  CommercialReviewPerspective,
  CommercialReviewPerspectiveResult,
  CommercialReviewResult,
  SupplierProductInput,
} from "../models/commercial-review.js";
import {
  COMMERCIAL_REVIEW_PERSPECTIVES,
  PERSPECTIVE_LABELS,
} from "../models/commercial-review.js";
import { getCisRepository } from "../repositories/sqlite-cis-repository.js";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function reviewPerspective(
  perspective: CommercialReviewPerspective,
  product: SupplierProductInput,
): CommercialReviewPerspectiveResult {
  const retail = product.suggestedRetailPrice ?? product.costPrice * 2.5;
  const margin = product.marginPercent ?? ((retail - product.costPrice) / retail) * 100;
  const hasImages = product.imageUrls.length > 0;
  const hasDesc = (product.description?.length ?? 0) > 20;

  const baseScores: Record<CommercialReviewPerspective, number> = {
    customer: hasDesc && hasImages ? 72 : 55,
    marketing: product.title.length >= 20 ? 68 : 50,
    brand: product.tags.length > 0 ? 65 : 58,
    operations: product.shippingDays != null && product.shippingDays <= 14 ? 70 : 62,
    supply_chain: product.supplierName ? 75 : 60,
    finance: margin >= 40 ? 78 : margin >= 25 ? 65 : 55,
    marketplace: product.category ? 70 : 50,
    product: hasDesc ? 72 : 48,
    risk: margin < 15 ? 45 : product.shippingDays != null && product.shippingDays > 21 ? 52 : 75,
  };

  const score = baseScores[perspective];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  switch (perspective) {
    case "customer":
      if (hasDesc) strengths.push("Product description provides customer context");
      else weaknesses.push("Insufficient product description for buyer decision");
      if (hasImages) strengths.push("Visual assets available");
      recommendations.push("Add lifestyle imagery showing product in use");
      break;
    case "marketing":
      if (product.title.length >= 30) strengths.push("Title has room for keyword placement");
      else weaknesses.push("Title too short for conversion optimization");
      recommendations.push("Lead with primary benefit in first 60 characters");
      break;
    case "brand":
      strengths.push("Supplier product can be repositioned under Empire brand");
      recommendations.push("Define brand voice before listing generation");
      break;
    case "operations":
      if (product.shippingDays != null && product.shippingDays <= 7) strengths.push("Fast shipping window");
      else if (product.shippingDays != null) recommendations.push("Set clear delivery expectations in listing");
      else recommendations.push("Confirm supplier shipping SLA before launch");
      break;
    case "supply_chain":
      strengths.push(`Supplier ${product.supplierName} identified as source`);
      recommendations.push("Verify supplier reliability score before scaling");
      break;
    case "finance":
      if (margin >= 40) strengths.push(`Strong margin at ${margin.toFixed(0)}%`);
      else if (margin >= 25) strengths.push(`Acceptable margin at ${margin.toFixed(0)}% for testing`);
      else recommendations.push("Consider premium positioning or bundle strategy to improve margin");
      break;
    case "marketplace":
      strengths.push(`Category ${product.category} has established demand patterns`);
      recommendations.push("Validate category competition before marketplace selection");
      break;
    case "product":
      if (hasDesc) strengths.push("Core product attributes documented");
      recommendations.push("Differentiate from supplier catalog with Empire value-add");
      break;
    case "risk":
      if (margin < 15) weaknesses.push("Low margin increases refund sensitivity");
      else strengths.push("Margin provides buffer for returns and ads");
      if (product.shippingDays != null && product.shippingDays > 21) {
        recommendations.push("Long shipping is a risk factor but not disqualifying alone");
      }
      break;
  }

  return {
    perspective,
    displayName: PERSPECTIVE_LABELS[perspective],
    score: clamp(score),
    strengths,
    weaknesses,
    recommendations: recommendations.length > 0 ? recommendations : [`Review ${PERSPECTIVE_LABELS[perspective]} dimension before launch`],
    confidence: clamp(score * 0.85 + (hasDesc ? 10 : 0)),
  };
}

/** CIS-001 — Commercial Review Engine. */
export function runCommercialReview(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
): CommercialReviewResult {
  getCisRepository().saveSupplierProduct(workspaceId, companyId, product);

  const perspectives = COMMERCIAL_REVIEW_PERSPECTIVES.map((p) => reviewPerspective(p, product));
  const aggregateScore = clamp(perspectives.reduce((s, p) => s + p.score, 0) / perspectives.length);
  const aggregateConfidence = clamp(perspectives.reduce((s, p) => s + p.confidence, 0) / perspectives.length);

  const result: CommercialReviewResult = {
    reviewId: randomUUID(),
    workspaceId,
    companyId,
    supplierProductId: product.supplierProductId,
    perspectives,
    aggregateScore,
    aggregateConfidence,
    reviewedAt: new Date().toISOString(),
  };

  getCisRepository().saveReview(result);
  return result;
}

export function getCommercialReview(
  workspaceId: string,
  companyId: string,
  supplierProductId: string,
): CommercialReviewResult | null {
  return getCisRepository().getLatestReview(workspaceId, companyId, supplierProductId);
}

export function listCommercialReviews(workspaceId: string, companyId: string): CommercialReviewResult[] {
  return getCisRepository().listReviews(workspaceId, companyId);
}
