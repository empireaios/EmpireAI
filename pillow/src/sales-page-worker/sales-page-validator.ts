import { SPW_METADATA_VERSION } from "./paths.js";
import type {
  SalesPageReport,
  SalesPageWorkerInput,
  SalesPageWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  processPayments?: boolean;
  deliverProducts?: boolean;
  publishWebsites?: boolean;
  publishPagesDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ509OrLater?: boolean;
  fabricateTestimonials?: boolean;
  validated?: boolean;
};

export class SalesPageValidator {
  decide(input: SalesPageWorkerInput): SalesPageWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateSalesPages(
    pages: SalesPageReport[] | null,
    input: SalesPageWorkerInput,
    started: number,
    options: { allowIncompletePage?: boolean } = {},
  ): SalesPageWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompletePage === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Sales Page Worker requires validated=true");
    }
    if (!pages || pages.length === 0) {
      if (decision !== "fail") {
        warnings.push("No sales pages were produced yet");
      }
    } else {
      for (const page of pages) {
        if (!page.salesPageId) errors.push("Missing sales page ID");
        if (page.salesPageId && !page.salesPageId.startsWith("spw-spg-")) {
          errors.push("Sales page ID must start with spw-spg-");
        }
        if (!page.timestamp) errors.push("Missing timestamp");
        if (!page.productId) errors.push("Missing product ID");
        if (page.productId && !page.productId.startsWith("spw-prd-")) {
          warnings.push("Product ID should start with spw-prd-");
        }
        if (!page.productTitle?.trim()) errors.push("Missing product title");
        if (!page.pageType) errors.push("Missing page type");
        if (!incompleteOk && !page.landingPageStructure.length) {
          errors.push("Missing landing page structure");
        }
        if (!incompleteOk && !page.headline?.trim()) {
          errors.push("Missing headline");
        }
        if (!incompleteOk && !page.ctaSummary?.trim()) {
          errors.push("Missing CTA summary");
        }
        if (!incompleteOk && !page.sectionsGenerated.length) {
          errors.push("Missing sections generated");
        }
        if (!incompleteOk && !page.complianceReview?.trim()) {
          errors.push("Missing compliance review");
        }
        if (!incompleteOk && !page.qualityReview?.trim()) {
          errors.push("Missing quality review");
        }
        if (page.confidenceScore == null) errors.push("Missing confidence score");
        if (!page.metadataVersion) errors.push("Missing metadata version");
        if (!page.neverProcessPayments) {
          errors.push("Sales Page Worker must never process payments");
        }
        if (!page.neverDeliverProducts) {
          errors.push("Sales Page Worker must never deliver products");
        }
        if (!page.neverPublishWebsites) {
          errors.push("Sales Page Worker must never publish websites");
        }
        if (!page.neverPublishPagesDirectly) {
          errors.push("Sales Page Worker must never publish pages directly");
        }
        if (!page.neverOverridePillow) {
          errors.push("Sales Page Worker must never override Pillow");
        }
        if (!page.neverOverrideGrandKing) {
          errors.push("Sales Page Worker must never override Grand King");
        }
        if (!page.neverImplementQ509OrLater) {
          errors.push("Sales Page Worker must never implement Q5-09 or later");
        }
        if (!page.neverFabricateTestimonials) {
          errors.push("Sales Page Worker must never fabricate testimonials");
        }
        if (!page.followApprovedProductInformation) {
          errors.push("Sales Page Worker must follow approved product information");
        }
        if (!page.produceOriginalSalesCopy) {
          errors.push("Sales Page Worker must produce original sales copy");
        }
        if (page.testimonials.some((t) => t.fabricated !== false)) {
          errors.push("Testimonials must set fabricated=false");
        }
        if (!page.landingPageStructure.length) {
          warnings.push(`Sales page ${page.salesPageId} structure not yet generated`);
        }
        if (!page.headline?.trim()) {
          warnings.push(`Sales page ${page.salesPageId} headline not yet generated`);
        }
        if (!page.benefitCopy?.trim()) {
          warnings.push(`Sales page ${page.salesPageId} benefit copy not yet generated`);
        }
        if (!page.featureSections.length) {
          warnings.push(`Sales page ${page.salesPageId} feature sections not yet generated`);
        }
        if (!page.pricingPresentation) {
          warnings.push(
            `Sales page ${page.salesPageId} pricing presentation not yet generated`,
          );
        }
        if (!page.testimonials.length) {
          warnings.push(
            `Sales page ${page.salesPageId} testimonials/placeholders not yet generated`,
          );
        }
        if (!page.faqs.length) {
          warnings.push(`Sales page ${page.salesPageId} FAQ sections not yet generated`);
        }
        if (!page.ctas.length) {
          warnings.push(`Sales page ${page.salesPageId} CTA sections not yet generated`);
        }
        if (!page.guarantees.length) {
          warnings.push(`Sales page ${page.salesPageId} guarantee sections not yet generated`);
        }
        if (!page.readabilityOptimized || !page.conversionOptimized) {
          warnings.push(
            `Sales page ${page.salesPageId} not yet optimized for readability/conversion`,
          );
        }
        if (!page.selfReviewPassed) {
          warnings.push(`Sales page ${page.salesPageId} self-review did not fully pass`);
        }
        if (page.researchCompliance === "non_compliant") {
          warnings.push(
            `Sales page ${page.salesPageId} research compliance is non_compliant`,
          );
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

  finalize(
    decision: SalesPageWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SalesPageWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `spw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SPW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.processPayments === true ||
      input.deliverProducts === true ||
      input.publishWebsites === true ||
      input.publishPagesDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ509OrLater === true ||
      input.fabricateTestimonials === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.processPayments) errors.push("Sales Page Worker must never process payments");
    if (input.deliverProducts) {
      errors.push("Sales Page Worker must never deliver products");
    }
    if (input.publishWebsites) {
      errors.push("Sales Page Worker must never publish websites");
    }
    if (input.publishPagesDirectly) {
      errors.push("Sales Page Worker must never publish pages directly");
    }
    if (input.overridePillow) errors.push("Sales Page Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Sales Page Worker must never override Grand King");
    }
    if (input.implementQ509OrLater) {
      errors.push("Sales Page Worker must never implement Q5-09 or later");
    }
    if (input.fabricateTestimonials) {
      errors.push("Sales Page Worker must never fabricate testimonials");
    }
  }
}

export class HealthMonitor {
  status(
    validationDecision: "pass" | "fail" | "partial" | null,
    enabled: boolean,
  ): "healthy" | "degraded" | "failed" | "standby" {
    if (!enabled) return "standby";
    if (validationDecision === "fail") return "failed";
    if (validationDecision === "partial") return "degraded";
    return "healthy";
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

  getFailureCount() {
    return this.failures;
  }
}
