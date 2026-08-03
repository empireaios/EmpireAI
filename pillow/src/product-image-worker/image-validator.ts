import { PIW_METADATA_VERSION } from "./paths.js";
import type {
  ProductImageReport,
  ProductImageWorkerInput,
  ProductImageWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  publishListings?: boolean;
  generateAdvertisements?: boolean;
  contactSuppliers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ308OrLater?: boolean;
  overwriteOriginalSourceAssets?: boolean;
  validated?: boolean;
};

export class ImageValidator {
  decide(input: ProductImageWorkerInput): ProductImageWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: ProductImageReport[] | null,
    input: ProductImageWorkerInput,
    started: number,
  ): ProductImageWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Product Image Worker requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No product image reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.imageReportId) errors.push("Missing image report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.productId) errors.push("Missing product ID");
        if (!report.supplierId) errors.push("Missing supplier ID");
        if (!report.sourceImages.length) errors.push("Missing source images");
        if (!report.processedImages.length) errors.push("Missing processed images");
        if (!report.imageQualityStatus) errors.push("Missing image quality status");
        if (!report.complianceStatus) errors.push("Missing compliance status");
        if (!report.processingSummary?.trim()) errors.push("Missing processing summary");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.preservedMetadata.length) {
          warnings.push(`Report ${report.imageReportId} missing preserved metadata`);
        }
        if (!report.neverOverwriteOriginalSourceAssets) {
          errors.push("Product Image Worker must never overwrite original source assets");
        }
        if (!report.preserveOriginalSupplierAssets) {
          errors.push("Product Image Worker must preserve original supplier assets");
        }
        if (!report.neverPublishListings) {
          errors.push("Product Image Worker must never publish listings");
        }
        if (!report.neverGenerateAdvertisements) {
          errors.push("Product Image Worker must never generate advertisements");
        }
        if (!report.neverImplementQ308OrLater) {
          errors.push("Product Image Worker must never implement Q3-08 or later");
        }
        if (!report.evaluationId && !report.discoveryId) {
          warnings.push(
            `Report ${report.imageReportId} missing evaluation/discovery traceability`,
          );
        }
        for (const processed of report.processedImages) {
          if (!processed.originalPreserved) {
            errors.push("Processed images must preserve original supplier assets");
          }
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
      input.generateAdvertisements === true ||
      input.contactSuppliers === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ308OrLater === true ||
      input.overwriteOriginalSourceAssets === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.publishListings === true) {
      errors.push("Product Image Worker must never publish listings");
    }
    if (input.generateAdvertisements === true) {
      errors.push("Product Image Worker must never generate advertisements");
    }
    if (input.contactSuppliers === true) {
      errors.push("Product Image Worker must never contact suppliers");
    }
    if (input.overridePillow === true) {
      errors.push("Product Image Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Product Image Worker must never override Grand King");
    }
    if (input.implementQ308OrLater === true) {
      errors.push("Product Image Worker must never implement Q3-08 or later");
    }
    if (input.overwriteOriginalSourceAssets === true) {
      errors.push("Product Image Worker must never overwrite original source assets");
    }
  }

  finalize(
    decision: ProductImageWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ProductImageWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `piw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PIW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: ProductImageWorkerValidationReport["decision"] | null,
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
