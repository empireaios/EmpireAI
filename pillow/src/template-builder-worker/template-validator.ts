import { TBW_METADATA_VERSION } from "./paths.js";
import type {
  TemplateBuilderReport,
  TemplateBuilderWorkerInput,
  TemplateBuilderWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  buildSalesPages?: boolean;
  processPayments?: boolean;
  deliverProductsToCustomers?: boolean;
  publishProductsDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ507OrLater?: boolean;
  validated?: boolean;
};

export class TemplateValidator {
  decide(input: TemplateBuilderWorkerInput): TemplateBuilderWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateTemplateProducts(
    products: TemplateBuilderReport[] | null,
    input: TemplateBuilderWorkerInput,
    started: number,
    options: { allowIncompleteProduct?: boolean } = {},
  ): TemplateBuilderWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteProduct === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Template Builder Worker requires validated=true");
    }
    if (!products || products.length === 0) {
      if (decision !== "fail") {
        warnings.push("No template products were produced yet");
      }
    } else {
      for (const product of products) {
        if (!product.templateProductId) errors.push("Missing template product ID");
        if (!product.timestamp) errors.push("Missing timestamp");
        if (!product.productId) errors.push("Missing product ID");
        if (!product.productTitle?.trim()) errors.push("Missing product title");
        if (!product.productCategory?.trim()) errors.push("Missing product category");
        if (!product.productType) errors.push("Missing product type");
        if (!product.targetAudience?.trim()) errors.push("Missing target audience");
        if (!incompleteOk && !product.templateTypes.length) {
          errors.push("Missing template types");
        }
        if (!incompleteOk && !product.includedAssets.length) {
          errors.push("Missing included assets");
        }
        if (!incompleteOk && !product.qualityReview?.trim()) {
          errors.push("Missing quality review");
        }
        if (!incompleteOk && !product.exportFormats.length) {
          errors.push("Missing export formats");
        }
        if (!incompleteOk && !product.supportedFormats.length) {
          errors.push("Missing supported formats");
        }
        if (product.confidenceScore == null) errors.push("Missing confidence score");
        if (!product.metadataVersion) errors.push("Missing metadata version");
        if (!product.neverBuildSalesPages) {
          errors.push("Template Builder Worker must never build sales pages");
        }
        if (!product.neverProcessPayments) {
          errors.push("Template Builder Worker must never process payments");
        }
        if (!product.neverDeliverProductsToCustomers) {
          errors.push("Template Builder Worker must never deliver products to customers");
        }
        if (!product.neverPublishProductsDirectly) {
          errors.push("Template Builder Worker must never publish products directly");
        }
        if (!product.neverOverridePillow) {
          errors.push("Template Builder Worker must never override Pillow");
        }
        if (!product.neverOverrideGrandKing) {
          errors.push("Template Builder Worker must never override Grand King");
        }
        if (!product.neverImplementQ507OrLater) {
          errors.push("Template Builder Worker must never implement Q5-07 or later");
        }
        if (!product.followApprovedProductResearch) {
          errors.push("Template Builder Worker must follow approved product research");
        }
        if (!product.produceOriginalReusableAssets) {
          errors.push("Template Builder Worker must produce original reusable assets");
        }
        if (!product.templates.length) {
          warnings.push(`Template product ${product.templateProductId} has no reusable templates yet`);
        }
        if (!product.planners.length) {
          warnings.push(`Template product ${product.templateProductId} planners not yet generated`);
        }
        if (!product.spreadsheets.length) {
          warnings.push(
            `Template product ${product.templateProductId} spreadsheets not yet generated`,
          );
        }
        if (!product.contracts.length) {
          warnings.push(
            `Template product ${product.templateProductId} contracts not yet generated`,
          );
        }
        if (!product.forms.length && !product.checklists.length) {
          warnings.push(
            `Template product ${product.templateProductId} forms/checklists not yet generated`,
          );
        }
        if (!product.promptLibrary.length) {
          warnings.push(
            `Template product ${product.templateProductId} prompt library not yet generated`,
          );
        }
        if (!product.qualityReview?.trim()) {
          warnings.push(
            `Template product ${product.templateProductId} quality review not yet completed`,
          );
        }
        if (!product.exportFormats.length) {
          warnings.push(
            `Template product ${product.templateProductId} export formats not yet prepared`,
          );
        }
        if (!product.usabilityValidated) {
          warnings.push(
            `Template product ${product.templateProductId} usability not yet validated`,
          );
        }
        if (!product.selfReviewPassed) {
          warnings.push(
            `Template product ${product.templateProductId} self-review did not fully pass`,
          );
        }
        if (product.researchCompliance === "non_compliant") {
          warnings.push(
            `Template product ${product.templateProductId} research compliance is non_compliant`,
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
    decision: TemplateBuilderWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): TemplateBuilderWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `tbw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TBW_METADATA_VERSION,
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
      input.implementQ507OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.buildSalesPages) errors.push("Template Builder Worker must never build sales pages");
    if (input.processPayments) errors.push("Template Builder Worker must never process payments");
    if (input.deliverProductsToCustomers) {
      errors.push("Template Builder Worker must never deliver products to customers");
    }
    if (input.publishProductsDirectly) {
      errors.push("Template Builder Worker must never publish products directly");
    }
    if (input.overridePillow) errors.push("Template Builder Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Template Builder Worker must never override Grand King");
    }
    if (input.implementQ507OrLater) {
      errors.push("Template Builder Worker must never implement Q5-07 or later");
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
