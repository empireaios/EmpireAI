import { randomUUID } from "node:crypto";

import type { AmazonListingPackage, AmazonListingPackageInput } from "../models/amazon-listing-package.js";
import type { AmazonReadinessEvaluation } from "../models/amazon-readiness.js";
import { getAmazonListingRepository } from "../repositories/sqlite-amazon-listing-repository.js";

const TITLE_MIN = 10;
const BULLET_MIN_CHARS = 10;
const IMAGE_MIN = 1;
const MAIN_IMAGE_REQUIRED = true;

/** RS-004 — Amazon Readiness Evaluation. */
export function evaluateAmazonListingReadiness(
  workspaceId: string,
  companyId: string,
  listing: AmazonListingPackage,
): AmazonReadinessEvaluation {
  const missing: string[] = [];
  const warnings: string[] = [];
  const complianceRisks: string[] = [];
  const humanActions: string[] = [];

  if (listing.title.length < TITLE_MIN) missing.push("Title too short (min 10 characters)");
  if (listing.bullets.length < 3) missing.push("At least 3 bullet points required");
  if (listing.bullets.some((b) => b.length < BULLET_MIN_CHARS)) warnings.push("Some bullet points are too short");
  if (listing.description.length < 50) missing.push("Description too short (min 50 characters)");
  if (listing.searchTerms.length === 0) warnings.push("Search terms not provided");
  if (!listing.category) missing.push("Category required");
  if (!listing.brand) missing.push("Brand required");
  if (listing.images.length < IMAGE_MIN) missing.push("At least one image required");
  if (MAIN_IMAGE_REQUIRED && !listing.images.some((i) => i.variant === "MAIN")) missing.push("Main image (MAIN variant) required");
  if (listing.pricing.listPrice <= 0) missing.push("List price required");
  if (listing.inventory.quantity <= 0) warnings.push("Zero inventory — listing will be suppressed");
  if (listing.shipping.weightKg <= 0) missing.push("Shipping weight required");
  if (!listing.marketplaceRegion) missing.push("Marketplace region required");

  if (listing.compliance.hazmat) complianceRisks.push("Hazmat product requires SDS documentation");
  if (listing.compliance.restrictedProduct) {
    complianceRisks.push("Restricted product category — approval required");
    humanActions.push("Apply for restricted category approval in Seller Central");
  }
  if (listing.compliance.brandRegistryRequired && !listing.compliance.documentsProvided.includes("brand_registry")) {
    complianceRisks.push("Brand Registry enrollment required");
    humanActions.push("Enroll brand in Amazon Brand Registry");
  }
  if (listing.compliance.categoryApprovalRequired) {
    complianceRisks.push("Category approval required");
    humanActions.push("Request category approval in Seller Central");
  }
  if (listing.compliance.productSafety && listing.compliance.documentsProvided.length === 0) {
    complianceRisks.push("Product safety documentation missing");
    humanActions.push("Upload product safety compliance documents");
  }

  if (!listing.asin && listing.category.includes("Electronics")) {
    warnings.push("ASIN not assigned — may require catalog matching for electronics");
  }

  const totalChecks = 15;
  const failedChecks = missing.length + complianceRisks.length;
  const warningPenalty = warnings.length * 0.5;
  const publishReadinessPercent = Math.max(0, Math.round(((totalChecks - failedChecks - warningPenalty) / totalChecks) * 100));

  const ready = missing.length === 0 && complianceRisks.length === 0 && publishReadinessPercent >= 80;

  return {
    listingId: listing.listingId,
    sku: listing.sku,
    ready,
    publishReadinessPercent,
    missingInformation: missing,
    warnings,
    complianceRisks,
    requiredHumanActions: humanActions,
    evaluatedAt: new Date().toISOString(),
  };
}

export function createAmazonListingPackage(
  workspaceId: string,
  companyId: string,
  input: AmazonListingPackageInput,
): AmazonListingPackage {
  const now = new Date().toISOString();
  const listing: AmazonListingPackage = {
    ...input,
    listingId: randomUUID(),
    workspaceId,
    companyId,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  };

  const evaluation = evaluateAmazonListingReadiness(workspaceId, companyId, listing);
  listing.status = evaluation.ready ? "READY" : evaluation.complianceRisks.length > 0 ? "BLOCKED" : "VALIDATED";

  getAmazonListingRepository().saveListing(listing);
  return listing;
}

export function evaluateListingById(
  workspaceId: string,
  companyId: string,
  listingId: string,
): AmazonReadinessEvaluation | null {
  const listing = getAmazonListingRepository().getListing(workspaceId, companyId, listingId);
  if (!listing) return null;
  return evaluateAmazonListingReadiness(workspaceId, companyId, listing);
}

export function listListingEvaluations(workspaceId: string, companyId: string): AmazonReadinessEvaluation[] {
  return getAmazonListingRepository()
    .listListings(workspaceId, companyId)
    .map((listing) => evaluateAmazonListingReadiness(workspaceId, companyId, listing));
}
