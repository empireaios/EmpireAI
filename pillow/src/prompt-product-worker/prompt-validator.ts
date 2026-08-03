import { PPW_METADATA_VERSION } from "./paths.js";
import type {
  PromptProductReport,
  PromptProductWorkerInput,
  PromptProductWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  buildSalesPages?: boolean;
  processPayments?: boolean;
  processCustomerPayments?: boolean;
  deliverProducts?: boolean;
  publishProductsDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ505OrLater?: boolean;
  validated?: boolean;
};

export class PromptValidator {
  decide(input: PromptProductWorkerInput): PromptProductWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validatePromptProducts(
    products: PromptProductReport[] | null,
    input: PromptProductWorkerInput,
    started: number,
    options: { allowIncompleteProduct?: boolean } = {},
  ): PromptProductWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteProduct === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Prompt Product Worker requires validated=true");
    }
    if (!products || products.length === 0) {
      if (decision !== "fail") {
        warnings.push("No prompt products were produced yet");
      }
    } else {
      for (const product of products) {
        if (!product.promptProductId) errors.push("Missing prompt product ID");
        if (!product.timestamp) errors.push("Missing timestamp");
        if (!product.productId) errors.push("Missing product ID");
        if (!product.productTitle?.trim()) errors.push("Missing product title");
        if (!product.productType) errors.push("Missing product type");
        if (!incompleteOk && !product.targetAiPlatforms.length) {
          errors.push("Missing target AI platforms");
        }
        if (!incompleteOk && !product.promptCategories.length) {
          errors.push("Missing prompt categories");
        }
        if (!incompleteOk && !product.promptLibrary.length) {
          errors.push("Missing prompt library");
        }
        if (!incompleteOk && !product.userInstructions?.trim()) {
          errors.push("Missing user instructions");
        }
        if (!incompleteOk && !product.qualityReview?.trim()) {
          errors.push("Missing quality review");
        }
        if (!incompleteOk && !product.exportFormats.length) {
          errors.push("Missing export formats");
        }
        if (product.confidenceScore == null) errors.push("Missing confidence score");
        if (!product.metadataVersion) errors.push("Missing metadata version");
        if (!product.neverBuildSalesPages) {
          errors.push("Prompt Product Worker must never build sales pages");
        }
        if (!product.neverProcessCustomerPayments && !product.neverProcessPayments) {
          errors.push("Prompt Product Worker must never process customer payments");
        }
        if (!product.neverDeliverProducts) {
          errors.push("Prompt Product Worker must never deliver products");
        }
        if (!product.neverPublishProductsDirectly) {
          errors.push("Prompt Product Worker must never publish products directly");
        }
        if (!product.neverOverridePillow) {
          errors.push("Prompt Product Worker must never override Pillow");
        }
        if (!product.neverOverrideGrandKing) {
          errors.push("Prompt Product Worker must never override Grand King");
        }
        if (!product.neverImplementQ505OrLater) {
          errors.push("Prompt Product Worker must never implement Q5-05 or later");
        }
        if (!product.followApprovedProductResearch) {
          errors.push("Prompt Product Worker must follow approved product research");
        }
        if (!product.produceOriginalPromptProducts) {
          errors.push("Prompt Product Worker must produce original prompt products");
        }
        if (!product.promptArchitecture) {
          warnings.push(`Prompt product ${product.promptProductId} architecture not yet designed`);
        }
        if (!product.promptLibrary.length) {
          warnings.push(`Prompt product ${product.promptProductId} has no library entries yet`);
        }
        if (!product.workflowComponents.length) {
          warnings.push(`Prompt product ${product.promptProductId} workflow components not yet created`);
        }
        if (!product.structuredPacks.length) {
          warnings.push(`Prompt product ${product.promptProductId} structured packs not yet organized`);
        }
        if (!product.userInstructions?.trim()) {
          warnings.push(`Prompt product ${product.promptProductId} user instructions not yet generated`);
        }
        if (!product.qualityReview?.trim()) {
          warnings.push(`Prompt product ${product.promptProductId} quality review not yet completed`);
        }
        if (!product.exportFormats.length) {
          warnings.push(`Prompt product ${product.promptProductId} export formats not yet packaged`);
        }
        if (!product.consistencyValidated) {
          warnings.push(`Prompt product ${product.promptProductId} consistency not yet validated`);
        }
        if (!product.selfReviewPassed) {
          warnings.push(`Prompt product ${product.promptProductId} self-review did not fully pass`);
        }
        if (product.researchCompliance === "non_compliant") {
          warnings.push(`Prompt product ${product.promptProductId} research compliance is non_compliant`);
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
    decision: PromptProductWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PromptProductWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `ppw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PPW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.processCustomerPayments === true ||
      input.deliverProducts === true ||
      input.publishProductsDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ505OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.buildSalesPages) errors.push("Prompt Product Worker must never build sales pages");
    if (input.processPayments || input.processCustomerPayments) {
      errors.push("Prompt Product Worker must never process customer payments");
    }
    if (input.deliverProducts) {
      errors.push("Prompt Product Worker must never deliver products");
    }
    if (input.publishProductsDirectly) {
      errors.push("Prompt Product Worker must never publish products directly");
    }
    if (input.overridePillow) errors.push("Prompt Product Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Prompt Product Worker must never override Grand King");
    if (input.implementQ505OrLater) {
      errors.push("Prompt Product Worker must never implement Q5-05 or later");
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
