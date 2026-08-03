import type { ProductListingReport } from "./types.js";

/** Authoritative in-memory Product Listing store — preparation only. */
export class ListingStore {
  private listings = new Map<string, ProductListingReport>();
  private latestListingId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    listingId: string;
    action: string;
    details: string;
  }> = [];

  seed(listings: ProductListingReport[]) {
    this.listings.clear();
    this.latestListingId = null;
    this.auditTrail = [];
    for (const listing of listings) {
      this.listings.set(listing.listingId, clone(listing));
      this.latestListingId = listing.listingId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        listingId: listing.listingId,
        action: "seed",
        details: `seeded listing product=${listing.productName}`,
      });
    }
  }

  count() {
    return this.listings.size;
  }

  list() {
    return [...this.listings.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(listingId: string) {
    const listing = this.listings.get(listingId);
    return listing ? clone(listing) : null;
  }

  getLatestListingId() {
    return this.latestListingId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(listing: ProductListingReport, action = "save") {
    this.listings.set(listing.listingId, clone(listing));
    this.latestListingId = listing.listingId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      listingId: listing.listingId,
      action,
      details: `product=${listing.productName} marketplace=${listing.marketplace} validation=${listing.listingValidationStatus}`,
    });
    return clone(listing);
  }

  markSubmitted(listingId: string, executiveReportId: string) {
    const current = this.listings.get(listingId);
    if (!current) return null;
    const updated: ProductListingReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(listing: ProductListingReport): ProductListingReport {
  return {
    ...listing,
    bulletPoints: [...listing.bulletPoints],
    attributes: listing.attributes.map((a) => ({ ...a })),
    variants: listing.variants.map((v) => ({
      ...v,
      attributes: v.attributes.map((a) => ({ ...a })),
    })),
    seoFields: {
      ...listing.seoFields,
      searchTerms: [...listing.seoFields.searchTerms],
      backendKeywords: [...listing.seoFields.backendKeywords],
    },
    listingPackage: {
      ...listing.listingPackage,
      fields: { ...listing.listingPackage.fields },
      imageRefs: [...listing.listingPackage.imageRefs],
      neverAutoPublished: true,
    },
    supportingEvidence: listing.supportingEvidence.map((e) => ({ ...e })),
  };
}
