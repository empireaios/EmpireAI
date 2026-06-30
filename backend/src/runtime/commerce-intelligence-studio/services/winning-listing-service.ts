import { randomUUID } from "node:crypto";

import type { SupplierProductInput } from "../models/commercial-review.js";
import type { WinningListingInput, WinningListingPackage } from "../models/winning-listing.js";
import { getCommercialReview } from "./commercial-review-service.js";
import { getCisRepository } from "../repositories/sqlite-cis-repository.js";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** CIS-002 — Winning Listing Engine (platform-neutral). */
export function generateWinningListing(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
  input: Pick<WinningListingInput, "supplierProductId" | "brandName"> & Partial<Pick<WinningListingInput, "tone" | "targetAudience">>,
): WinningListingPackage {
  const tone = input.tone ?? "professional";
  const review = getCommercialReview(workspaceId, companyId, product.supplierProductId);
  const retail = product.suggestedRetailPrice ?? product.costPrice * 2.5;
  const primaryBenefit = product.title.split(" ").slice(0, 4).join(" ");

  const title = `${primaryBenefit} — ${input.brandName} | Premium ${product.category.split(">")[0]?.trim() ?? product.category}`;
  const description = [
    `Discover the ${input.brandName} difference.`,
    product.description ?? `Premium ${product.title} designed for discerning customers.`,
    `Backed by ${input.brandName} quality standards and customer-first support.`,
  ].join(" ");

  const benefits = [
    `Solves a real customer need in ${product.category}`,
    `Competitive value at $${retail.toFixed(2)}`,
    `${input.brandName} brand trust and support`,
  ];

  const features = Object.entries(product.attributes).map(([k, v]) => `${k}: ${v}`);
  if (features.length === 0) {
    features.push("Quality construction", "Designed for daily use", "Easy to set up");
  }

  const emotionalSelling = [
    "Feel confident in your purchase decision",
    "Join customers who chose quality over compromise",
  ];

  const trustSignals = [
    `${input.brandName} satisfaction commitment`,
    "Secure checkout and buyer protection",
    product.supplierName ? `Sourced from verified supplier ${product.supplierName}` : "Verified supplier network",
  ];

  const objectionHandlers = [
    "Price concern: Compare total value including quality and support",
    "Shipping concern: Clear delivery timeline provided at checkout",
    "Quality concern: Brand standards applied before listing approval",
  ];

  const faqs = [
    { question: "What is included?", answer: "Full product as described with standard packaging." },
    { question: "How long is shipping?", answer: product.shippingDays ? `Estimated ${product.shippingDays} business days.` : "Shipping timeline confirmed at order." },
    { question: "What is the return policy?", answer: "Standard return window applies per marketplace policy." },
  ];

  const guarantees = [
    `${input.brandName} quality assurance`,
    "Customer support for order issues",
  ];

  const shippingMessaging = product.shippingDays
    ? `Ships within ${product.shippingDays} business days. Tracking provided.`
    : "Fast processing with tracking on dispatch.";

  const callToAction = tone === "urgent"
    ? "Order now — limited availability"
    : tone === "premium"
      ? "Experience premium quality today"
      : "Add to cart and shop with confidence";

  const seoKeywords = [
    ...product.tags,
    product.category.toLowerCase(),
    input.brandName.toLowerCase(),
    ...product.title.toLowerCase().split(" ").filter((w) => w.length > 3).slice(0, 5),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const seoQualityScore = clamp(
    (title.length >= 40 ? 25 : 15) +
    (seoKeywords.length >= 5 ? 25 : 15) +
    (description.length >= 100 ? 25 : 10) +
    (benefits.length >= 3 ? 25 : 15),
  );

  const conversionQualityScore = clamp(
    (benefits.length >= 3 ? 20 : 10) +
    (objectionHandlers.length >= 2 ? 20 : 10) +
    (faqs.length >= 2 ? 20 : 10) +
    (callToAction.length > 10 ? 20 : 10) +
    (trustSignals.length >= 2 ? 20 : 10),
  );

  const brandConsistencyScore = clamp(
    (title.includes(input.brandName) ? 35 : 15) +
    (description.includes(input.brandName) ? 35 : 15) +
    (guarantees.some((g) => g.includes(input.brandName)) ? 30 : 15),
  );

  const reviewBoost = review ? review.aggregateScore * 0.15 : 0;
  const listingStrengthScore = clamp(
    seoQualityScore * 0.25 +
    conversionQualityScore * 0.35 +
    brandConsistencyScore * 0.25 +
    reviewBoost,
  );

  const listing: WinningListingPackage = {
    listingId: randomUUID(),
    workspaceId,
    companyId,
    supplierProductId: product.supplierProductId,
    title,
    description,
    benefits,
    features,
    emotionalSelling,
    trustSignals,
    objectionHandlers,
    faqs,
    guarantees,
    shippingMessaging,
    callToAction,
    seoKeywords,
    seoQualityScore,
    conversionQualityScore,
    brandConsistencyScore,
    listingStrengthScore,
    generatedAt: new Date().toISOString(),
  };

  getCisRepository().saveWinningListing(listing);
  return listing;
}

export function getWinningListing(
  workspaceId: string,
  companyId: string,
  listingId: string,
): WinningListingPackage | null {
  return getCisRepository().getWinningListing(workspaceId, companyId, listingId);
}

export function listWinningListings(workspaceId: string, companyId: string): WinningListingPackage[] {
  return getCisRepository().listWinningListings(workspaceId, companyId);
}
