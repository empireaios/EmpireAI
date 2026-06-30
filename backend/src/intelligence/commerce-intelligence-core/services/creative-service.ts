import { randomUUID } from "node:crypto";

import type {
  CreativePackage,
  MarketplaceStudy,
  ProductCandidate,
  ProductFitIntelligence,
} from "../models/commerce-intelligence-core.js";

/** Creative intelligence — generates launch assets and asset plans under Pillow ownership. */
export function generateCreativePackage(
  candidate: ProductCandidate,
  study: MarketplaceStudy,
  fit: ProductFitIntelligence,
): CreativePackage {
  const title =
    fit.route === "shopify"
      ? `${candidate.title} — Premium ${candidate.category.split(" ")[0] ?? "Home"} Collection`
      : `${candidate.title} — ${candidate.category} for Everyday Use`;

  const bulletPoints = [
    `Engineered for ${fit.buyerPersona.toLowerCase()} who need reliable ${candidate.category.toLowerCase()} performance`,
    `Solves ${fit.painPoint.toLowerCase()}`,
    `Ships from supplier network with ${candidate.estimatedDeliveryDays.min}–${candidate.estimatedDeliveryDays.max} day delivery to US`,
    `Competitive positioning within $${study.competitorPriceRangeUsd.min}–$${study.competitorPriceRangeUsd.max} market range`,
    fit.route === "shopify"
      ? "Brand-ready packaging narrative for DTC storefront launch"
      : "Amazon-optimized listing structure with keyword-rich copy",
  ];

  const productDescription = `${title} addresses ${fit.painPoint}. Pillow Commerce Intelligence identified category fit score ${study.categoryFitScore}/100 on Amazon US with ${fit.route} route recommendation. Expected buyer: ${fit.buyerPersona}.`;

  const seoCopy = `${candidate.category}, ${candidate.title}, ${fit.buyerPersona}, home essentials, ${fit.route === "shopify" ? "premium DTC" : "Amazon bestseller"}`;

  const amazonListingCopy = `${productDescription}\n\nKey benefits:\n${bulletPoints.map((b) => `• ${b}`).join("\n")}\n\nShips to: ${candidate.shippingCountries.join(", ")}`;

  const shopifyBrandCopy = fit.route === "shopify"
    ? `Introducing ${title}. Crafted for customers who expect more from their ${candidate.category.toLowerCase()}. ${fit.routeRationale}`
    : `Available via EmpireAI premium route when brand elevation is warranted.`;

  const imageImprovementPlan =
    candidate.images.length >= 2
      ? ["Add lifestyle kitchen scene", "Infographic for dimensions and materials", "Before/after use case shot"]
      : ["Source 3 additional supplier images", "Generate lifestyle mockup", "Create comparison chart vs competitors"];

  const mediaReadiness: CreativePackage["mediaReadiness"] =
    candidate.images.length >= 3 ? "ready" : candidate.images.length >= 1 ? "needs_assets" : "blocked";

  const mediaGenerationTasks = imageImprovementPlan.map((desc, i) => ({
    taskId: randomUUID(),
    taskType: (i === 0 ? "image" : i === 1 ? "infographic" : "video") as "image" | "video" | "infographic",
    description: desc,
    status: mediaReadiness === "ready" ? ("ready" as const) : ("planned" as const),
  }));

  const positioningAngle =
    fit.route === "shopify"
      ? `Premium ${candidate.category.toLowerCase()} for discerning ${fit.buyerPersona.toLowerCase()}`
      : `Best-value ${candidate.category.toLowerCase()} solving ${fit.painPoint.toLowerCase()}`;

  return {
    title,
    bulletPoints,
    productDescription,
    seoCopy,
    amazonListingCopy,
    shopifyBrandCopy,
    imageImprovementPlan,
    infographicConcept: `Split-panel infographic: pain point → product solution → ${study.competitorPriceRangeUsd.max} value anchor`,
    shortVideoConcept: `15s TikTok hook: "Stop replacing cheap accessories" → product demo → CTA`,
    adHooks: [
      `Why ${fit.buyerPersona.split(" ")[0]}s are switching to this ${candidate.category.toLowerCase()}`,
      `The ${candidate.category.toLowerCase()} gap Amazon reviews keep mentioning`,
      `$${study.competitorPriceRangeUsd.min} solution to ${fit.painPoint.toLowerCase()}`,
    ],
    metaAdCopy: `${title} — ${fit.painPoint}. Free shipping eligible. Shop now.`,
    tiktokScript: `[0-3s] Hook: "${fit.painPoint}" [3-10s] Product demo with ${candidate.title} [10-15s] Price anchor $${study.competitorPriceRangeUsd.min} + Shop Now`,
    positioningAngle,
    mediaGenerationTasks,
    creativePackageStatus: mediaReadiness === "ready" ? "complete" : mediaReadiness === "needs_assets" ? "partial" : "planned",
    mediaReadiness,
  };
}
