import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { SupplierProductInput } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { generateWinningListing } from "../../commerce-intelligence-studio/services/winning-listing-service.js";
import { getCommercialReview } from "../../commerce-intelligence-studio/services/commercial-review-service.js";
import type { ListingIntelligencePackage } from "../models/listing-intelligence-package.js";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** REAL-004 — Build world's highest quality listing (reuses CIS, no duplicate intelligence). */
export function buildListingIntelligence(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
  brandName = "Empire Brand",
): ListingIntelligencePackage {
  const cisListing = generateWinningListing(workspaceId, companyId, product, {
    supplierProductId: product.supplierProductId,
    brandName,
  });
  const review = getCommercialReview(workspaceId, companyId, product.supplierProductId);
  const retail = product.suggestedRetailPrice ?? product.costPrice * 2.5;
  const margin = ((retail - product.costPrice) / retail) * 100;

  const pkg: ListingIntelligencePackage = {
    packageId: randomUUID(),
    workspaceId,
    companyId,
    supplierProductId: product.supplierProductId,
    title: cisListing.title,
    seoTitle: `${product.title} | ${brandName} | Buy Online`.slice(0, 200),
    searchTerms: cisListing.seoKeywords ?? [product.category, product.title.split(" ")[0] ?? "product"],
    description: cisListing.description,
    bulletPoints: cisListing.benefits.concat(cisListing.features).slice(0, 5),
    specifications: product.attributes,
    comparisonTable: [
      { attribute: "Price", value: `$${retail.toFixed(2)}`, competitor: "Market average higher" },
      { attribute: "Quality", value: `${brandName} standards`, competitor: "Generic alternatives" },
    ],
    faq: cisListing.faqs,
    productStory: `The ${product.title} represents ${brandName}'s commitment to solving real customer problems in ${product.category}.`,
    targetAudience: "Quality-conscious online shoppers",
    keywords: cisListing.seoKeywords ?? [],
    countryLocalizations: [
      { country: "US", title: cisListing.title, description: cisListing.description },
      { country: "UK", title: cisListing.title.replace("Premium", "Premium UK"), description: cisListing.description },
    ],
    marketplaceFormatting: { platformNeutral: true, cisListingId: cisListing.listingId },
    pricingRecommendation: { retail, min: retail * 0.9, max: retail * 1.15, currency: "USD" },
    marginRecommendation: { percent: clamp(margin), rationale: margin >= 40 ? "Healthy margin for USD 100K mission" : "Margin below target — review supplier cost" },
    confidenceScore: review?.aggregateConfidence ?? cisListing.listingStrengthScore ?? 65,
    listingQualityScore: clamp((review?.aggregateScore ?? 60) + (product.imageUrls.length > 0 ? 10 : 0)),
    marketplaceReadiness: clamp(review?.aggregateScore ?? 55),
    reusedModules: ["commerce-intelligence-studio", "empire-knowledge", "executive-council"],
    computedAt: new Date().toISOString(),
  };

  persistListing(pkg);
  return pkg;
}

function persistListing(pkg: ListingIntelligencePackage): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO listing_intelligence_records (record_id, workspace_id, supplier_product_id, record_json, updated_at)
     VALUES (@id, @ws, @spid, @json, @at)
     ON CONFLICT(record_id) DO UPDATE SET record_json = @json, updated_at = @at`,
  ).run({ id: pkg.packageId, ws: pkg.workspaceId, spid: pkg.supplierProductId, json: JSON.stringify(pkg), at: pkg.computedAt });
}

export function resetListingIntelligence(): void {
  getDatabase().prepare(`DELETE FROM listing_intelligence_records`).run();
}
