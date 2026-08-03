import { EBW_METADATA_VERSION } from "./paths.js";
import type {
  EbookReport,
  EbookWorkerInput,
  EbookWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  buildSalesPages?: boolean;
  processPayments?: boolean;
  deliverProductsToCustomers?: boolean;
  publishProductsDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ504OrLater?: boolean;
  validated?: boolean;
};

export class EbookValidator {
  decide(input: EbookWorkerInput): EbookWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateEbooks(
    ebooks: EbookReport[] | null,
    input: EbookWorkerInput,
    started: number,
    options: { allowIncompleteManuscript?: boolean } = {},
  ): EbookWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteManuscript === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Ebook Worker requires validated=true");
    }
    if (!ebooks || ebooks.length === 0) {
      if (decision !== "fail") {
        warnings.push("No ebooks were produced yet");
      }
    } else {
      for (const ebook of ebooks) {
        if (!ebook.ebookId) errors.push("Missing ebook ID");
        if (!ebook.timestamp) errors.push("Missing timestamp");
        if (!ebook.productId) errors.push("Missing product ID");
        if (!ebook.productTitle?.trim()) errors.push("Missing product title");
        if (!ebook.productType) errors.push("Missing product type");
        if (!ebook.targetAudience?.trim()) errors.push("Missing target audience");
        if (!incompleteOk && !ebook.chapterStructure.length) {
          errors.push("Missing chapter structure");
        }
        if (!incompleteOk && ebook.wordCount == null) errors.push("Missing word count");
        if (!incompleteOk && !ebook.includedResources.length) {
          errors.push("Missing included resources");
        }
        if (!incompleteOk && !ebook.qualityReview?.trim()) {
          errors.push("Missing quality review");
        }
        if (!incompleteOk && !ebook.exportFormats.length) {
          errors.push("Missing export formats");
        }
        if (ebook.confidenceScore == null) errors.push("Missing confidence score");
        if (!ebook.metadataVersion) errors.push("Missing metadata version");
        if (!ebook.neverBuildSalesPages) {
          errors.push("Ebook Worker must never build sales pages");
        }
        if (!ebook.neverProcessPayments) {
          errors.push("Ebook Worker must never process payments");
        }
        if (!ebook.neverDeliverProductsToCustomers) {
          errors.push("Ebook Worker must never deliver products to customers");
        }
        if (!ebook.neverPublishProductsDirectly) {
          errors.push("Ebook Worker must never publish products directly");
        }
        if (!ebook.neverOverridePillow) {
          errors.push("Ebook Worker must never override Pillow");
        }
        if (!ebook.neverOverrideGrandKing) {
          errors.push("Ebook Worker must never override Grand King");
        }
        if (!ebook.neverImplementQ504OrLater) {
          errors.push("Ebook Worker must never implement Q5-04 or later");
        }
        if (!ebook.followApprovedProductResearch) {
          errors.push("Ebook Worker must follow approved product research");
        }
        if (!ebook.produceOriginalContent) {
          errors.push("Ebook Worker must produce original content");
        }
        if (!ebook.chapterStructure.length) {
          warnings.push(`Ebook ${ebook.ebookId} chapter structure not yet created`);
        }
        if (!ebook.chapters.length) {
          warnings.push(`Ebook ${ebook.ebookId} has no written chapter bodies yet`);
        }
        if (!ebook.includedResources.length) {
          warnings.push(`Ebook ${ebook.ebookId} included resources not yet generated`);
        }
        if (!ebook.qualityReview?.trim()) {
          warnings.push(`Ebook ${ebook.ebookId} quality review not yet completed`);
        }
        if (!ebook.exportFormats.length) {
          warnings.push(`Ebook ${ebook.ebookId} export formats not yet prepared`);
        }
        if (!ebook.formattingApplied) {
          warnings.push(`Ebook ${ebook.ebookId} formatting not yet applied`);
        }
        if (!ebook.selfReviewPassed) {
          warnings.push(`Ebook ${ebook.ebookId} self-review did not fully pass`);
        }
        if (ebook.researchCompliance === "non_compliant") {
          warnings.push(`Ebook ${ebook.ebookId} research compliance is non_compliant`);
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
    decision: EbookWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): EbookWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `ebw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EBW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.deliverProductsToCustomers === true ||
      input.publishProductsDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ504OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.buildSalesPages) errors.push("Ebook Worker must never build sales pages");
    if (input.processPayments) errors.push("Ebook Worker must never process payments");
    if (input.deliverProductsToCustomers) {
      errors.push("Ebook Worker must never deliver products to customers");
    }
    if (input.publishProductsDirectly) {
      errors.push("Ebook Worker must never publish products directly");
    }
    if (input.overridePillow) errors.push("Ebook Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Ebook Worker must never override Grand King");
    if (input.implementQ504OrLater) {
      errors.push("Ebook Worker must never implement Q5-04 or later");
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
