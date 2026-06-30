import { randomUUID } from "node:crypto";

import type { SupplierProductInput } from "../../commerce-intelligence-studio/models/commercial-review.js";
import type { ProductMediaPackage } from "../models/product-media-package.js";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** REAL-005 — Media recommendations only (no image AI integration). */
export function buildProductMediaIntelligence(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
): ProductMediaPackage {
  const supplierImages = product.imageUrls.map((url, i) => ({
    url,
    role: i === 0 ? "MAIN" : `GALLERY_${i}`,
  }));

  const gaps: string[] = [];
  const recommendations: ProductMediaPackage["recommendations"] = [];

  if (supplierImages.length === 0) {
    gaps.push("No supplier images — lifestyle and infographic required before publish");
    recommendations.push({
      mediaType: "lifestyle_image",
      priority: "CRITICAL",
      recommendation: "Executive Council recommends lifestyle context shot for conversion",
      executiveOnly: true,
    });
  }
  if (supplierImages.length < 3) {
    gaps.push("Marketplace gallery requires minimum 3 images");
    recommendations.push({
      mediaType: "marketplace_gallery",
      priority: "HIGH",
      recommendation: "Add gallery slots: main, detail, scale reference",
      executiveOnly: true,
    });
  }
  recommendations.push({
    mediaType: "infographic",
    priority: "MEDIUM",
    recommendation: "Feature/benefit infographic for A+ content readiness",
    executiveOnly: true,
  });
  recommendations.push({
    mediaType: "comparison_image",
    priority: "LOW",
    recommendation: "Competitive comparison visual for premium positioning",
    executiveOnly: true,
  });

  const generationQueue = recommendations.map((r) => ({
    queueId: randomUUID(),
    mediaType: r.mediaType,
    status: "RECOMMENDED" as const,
    reason: "Architecture queue — generation blocked until media AI phase",
  }));

  return {
    packageId: randomUUID(),
    workspaceId,
    companyId,
    supplierProductId: product.supplierProductId,
    supplierImages,
    recommendations,
    mediaQualityScore: clamp(supplierImages.length * 25),
    mediaGaps: gaps,
    generationQueue,
    architectureOnly: true,
    computedAt: new Date().toISOString(),
  };
}
