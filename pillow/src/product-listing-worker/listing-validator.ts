import { PLW_METADATA_VERSION } from "./paths.js";
import type {
  ProductListingReport,
  ProductListingWorkerInput,
  ProductListingWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  publishListings?: boolean;
  modifySupplierInformation?: boolean;
  modifyPricing?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ309OrLater?: boolean;
  validated?: boolean;
};

export class ListingValidator {
  decide(input: ProductListingWorkerInput): ProductListingWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateListings(
    listings: ProductListingReport[] | null,
    input: ProductListingWorkerInput,
    started: number,
  ): ProductListingWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Product Listing Worker requires validated=true");
    }

    if (!listings || listings.length === 0) {
      if (decision !== "fail") {
        warnings.push("No product listings were produced yet");
      }
    } else {
      for (const listing of listings) {
        if (!listing.listingId) errors.push("Missing listing ID");
        if (!listing.timestamp) errors.push("Missing timestamp");
        if (!listing.productId) errors.push("Missing product ID");
        if (!listing.marketplace) errors.push("Missing marketplace");
        if (!listing.productTitle?.trim()) errors.push("Missing product title");
        if (!listing.productDescription?.trim()) errors.push("Missing product description");
        if (!listing.bulletPoints.length) errors.push("Missing bullet points");
        if (!listing.attributes.length) errors.push("Missing attributes");
        if (!listing.variants.length) errors.push("Missing variants");
        if (!listing.seoFields?.metaTitle?.trim()) errors.push("Missing SEO meta title");
        if (!listing.seoFields?.metaDescription?.trim()) {
          errors.push("Missing SEO meta description");
        }
        if (!listing.listingValidationStatus) errors.push("Missing listing validation status");
        if (!listing.listingPackage?.packageId) errors.push("Missing listing package");
        if (!listing.metadataVersion) errors.push("Missing metadata version");
        if (!listing.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!listing.neverPublishListings) {
          errors.push("Product Listing Worker must never publish listings");
        }
        if (!listing.neverModifySupplierInformation) {
          errors.push("Product Listing Worker must never modify supplier information");
        }
        if (!listing.neverModifyPricing) {
          errors.push("Product Listing Worker must never modify pricing");
        }
        if (!listing.neverImplementQ309OrLater) {
          errors.push("Product Listing Worker must never implement Q3-09 or later");
        }
        if (!listing.listingPackage.neverAutoPublished) {
          errors.push("Listing packages must never auto-publish");
        }
        if (!listing.supplierId && !listing.evaluationId && !listing.discoveryId) {
          warnings.push(`Listing ${listing.listingId} missing supplier/product traceability`);
        }
        if (!listing.imageReportId) {
          warnings.push(`Listing ${listing.listingId} missing product image report reference`);
        }
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.publishListings === true ||
      input.modifySupplierInformation === true ||
      input.modifyPricing === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ309OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.publishListings === true) {
      errors.push("Product Listing Worker must never publish listings");
    }
    if (input.modifySupplierInformation === true) {
      errors.push("Product Listing Worker must never modify supplier information");
    }
    if (input.modifyPricing === true) {
      errors.push("Product Listing Worker must never modify pricing");
    }
    if (input.overridePillow === true) {
      errors.push("Product Listing Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Product Listing Worker must never override Grand King");
    }
    if (input.implementQ309OrLater === true) {
      errors.push("Product Listing Worker must never implement Q3-09 or later");
    }
  }

  finalize(
    decision: ProductListingWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ProductListingWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `plw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PLW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: ProductListingWorkerValidationReport["decision"] | null,
    enabled: boolean,
  ) {
    if (!enabled) return "standby" as const;
    if (decision === "fail" || decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
