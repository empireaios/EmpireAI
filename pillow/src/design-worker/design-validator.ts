import { DW_METADATA_VERSION } from "./paths.js";
import type {
  DesignWorkerInput,
  DesignWorkerReport,
  DesignWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  buildSalesPages?: boolean;
  processPayments?: boolean;
  deliverProducts?: boolean;
  publishAssetsDirectly?: boolean;
  publishProductsDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ508OrLater?: boolean;
  validated?: boolean;
};

export class DesignValidator {
  decide(input: DesignWorkerInput): DesignWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateDesignReports(
    reports: DesignWorkerReport[] | null,
    input: DesignWorkerInput,
    started: number,
    options: { allowIncompleteDesign?: boolean } = {},
  ): DesignWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteDesign === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Design Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No design reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.designReportId) errors.push("Missing design report ID");
        if (report.designReportId && !report.designReportId.startsWith("dw-dsr-")) {
          errors.push("Design report ID must start with dw-dsr-");
        }
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.productId) errors.push("Missing product ID");
        if (!report.productTitle?.trim()) errors.push("Missing product title");
        if (!report.productCategory?.trim()) errors.push("Missing product category");
        if (!report.productType) errors.push("Missing product type");
        if (!report.brandingTheme?.trim()) errors.push("Missing branding theme");
        if (!incompleteOk && !report.assetTypesCreated.length) {
          errors.push("Missing asset types created");
        }
        if (!incompleteOk && !report.qualityReview?.trim()) {
          errors.push("Missing quality review");
        }
        if (!incompleteOk && !report.exportFormats.length) {
          errors.push("Missing export formats");
        }
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.neverBuildSalesPages) {
          errors.push("Design Worker must never build sales pages");
        }
        if (!report.neverProcessPayments) {
          errors.push("Design Worker must never process payments");
        }
        if (!report.neverDeliverProducts) {
          errors.push("Design Worker must never deliver products");
        }
        if (!report.neverPublishAssetsDirectly) {
          errors.push("Design Worker must never publish assets directly");
        }
        if (!report.neverPublishProductsDirectly) {
          errors.push("Design Worker must never publish products directly");
        }
        if (!report.neverOverridePillow) {
          errors.push("Design Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Design Worker must never override Grand King");
        }
        if (!report.neverImplementQ508OrLater) {
          errors.push("Design Worker must never implement Q5-08 or later");
        }
        if (!report.followApprovedProductIntent) {
          errors.push("Design Worker must follow approved product intent");
        }
        if (!report.produceOriginalVisualAssets) {
          errors.push("Design Worker must produce original visual assets");
        }
        if (!report.ebookCovers.length) {
          warnings.push(`Design report ${report.designReportId} has no ebook covers yet`);
        }
        if (!report.courseCovers.length) {
          warnings.push(`Design report ${report.designReportId} has no course covers yet`);
        }
        if (!report.brandingAssets.length) {
          warnings.push(`Design report ${report.designReportId} branding assets not yet generated`);
        }
        if (!report.promotionalGraphics.length) {
          warnings.push(
            `Design report ${report.designReportId} promotional graphics not yet generated`,
          );
        }
        if (!report.mockupAssets.length) {
          warnings.push(`Design report ${report.designReportId} mockups not yet generated`);
        }
        if (!report.previewAssets.length) {
          warnings.push(`Design report ${report.designReportId} preview images not yet generated`);
        }
        if (!report.qualityReview?.trim()) {
          warnings.push(
            `Design report ${report.designReportId} quality review not yet completed`,
          );
        }
        if (!report.exportFormats.length) {
          warnings.push(
            `Design report ${report.designReportId} export formats not yet prepared`,
          );
        }
        if (!report.brandingConsistencyValidated) {
          warnings.push(
            `Design report ${report.designReportId} branding consistency not yet validated`,
          );
        }
        if (!report.selfReviewPassed) {
          warnings.push(
            `Design report ${report.designReportId} self-review did not fully pass`,
          );
        }
        if (report.researchCompliance === "non_compliant") {
          warnings.push(
            `Design report ${report.designReportId} research compliance is non_compliant`,
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
    decision: DesignWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): DesignWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `dw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.deliverProducts === true ||
      input.publishAssetsDirectly === true ||
      input.publishProductsDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ508OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.buildSalesPages) errors.push("Design Worker must never build sales pages");
    if (input.processPayments) errors.push("Design Worker must never process payments");
    if (input.deliverProducts) {
      errors.push("Design Worker must never deliver products");
    }
    if (input.publishAssetsDirectly) {
      errors.push("Design Worker must never publish assets directly");
    }
    if (input.publishProductsDirectly) {
      errors.push("Design Worker must never publish products directly");
    }
    if (input.overridePillow) errors.push("Design Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Design Worker must never override Grand King");
    }
    if (input.implementQ508OrLater) {
      errors.push("Design Worker must never implement Q5-08 or later");
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
