import { DDW_METADATA_VERSION } from "./paths.js";
import type {
  DigitalDeliveryReport,
  DigitalDeliveryWorkerInput,
  DigitalDeliveryWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  processPayments?: boolean;
  createProducts?: boolean;
  publishStorefronts?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ511OrLater?: boolean;
  exposeUnauthorizedAccess?: boolean;
  bypassPillowGovernance?: boolean;
  validated?: boolean;
};

export class DigitalDeliveryValidator {
  decide(input: DigitalDeliveryWorkerInput): DigitalDeliveryWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateDeliveries(
    deliveries: DigitalDeliveryReport[] | null,
    input: DigitalDeliveryWorkerInput,
    started: number,
    options: { allowIncompleteDelivery?: boolean } = {},
  ): DigitalDeliveryWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteDelivery === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Digital Delivery Worker requires validated=true");
    }
    if (!deliveries || deliveries.length === 0) {
      if (decision !== "fail") {
        warnings.push("No deliveries were produced yet");
      }
    } else {
      for (const delivery of deliveries) {
        if (!delivery.deliveryId) errors.push("Missing delivery ID");
        if (delivery.deliveryId && !delivery.deliveryId.startsWith("ddw-dlv-")) {
          errors.push("Delivery ID must start with ddw-dlv-");
        }
        if (!delivery.timestamp) errors.push("Missing timestamp");
        if (!delivery.orderId) errors.push("Missing order ID");
        if (!delivery.productId) errors.push("Missing product ID");
        if (!delivery.customerReference?.trim()) errors.push("Missing customer reference");
        if (!delivery.deliveryMethod) errors.push("Missing delivery method");
        if (!delivery.deliveryStatus) errors.push("Missing delivery status");
        if (!delivery.retryStatus) errors.push("Missing retry status");
        if (!delivery.fulfilmentConfirmation) errors.push("Missing fulfilment confirmation");
        if (!incompleteOk && !delivery.deliveredAssets.length) {
          errors.push("Missing delivered assets");
        }
        if (!incompleteOk && !delivery.complianceReview?.trim()) {
          errors.push("Missing compliance review");
        }
        if (!incompleteOk && !delivery.qualityReview?.trim()) {
          errors.push("Missing quality review");
        }
        if (delivery.confidenceScore == null) errors.push("Missing confidence score");
        if (!delivery.metadataVersion) errors.push("Missing metadata version");
        for (const link of delivery.secureDownloadLinks) {
          if (link.tokenPresent) {
            errors.push("Secure download links must never include live tokens");
          }
          if (!link.authorized) {
            errors.push("Secure download links must be authorized structural signals only");
          }
        }
        if (!delivery.neverProcessPayments) {
          errors.push("Digital Delivery Worker must never process payments");
        }
        if (!delivery.neverCreateProducts) {
          errors.push("Digital Delivery Worker must never create products");
        }
        if (!delivery.neverPublishStorefronts) {
          errors.push("Digital Delivery Worker must never publish storefronts");
        }
        if (!delivery.neverOverridePillow) {
          errors.push("Digital Delivery Worker must never override Pillow");
        }
        if (!delivery.neverOverrideGrandKing) {
          errors.push("Digital Delivery Worker must never override Grand King");
        }
        if (!delivery.neverImplementQ511OrLater) {
          errors.push("Digital Delivery Worker must never implement Q5-11 or later");
        }
        if (!delivery.neverExposeUnauthorizedAccess) {
          errors.push("Digital Delivery Worker must never expose unauthorized access");
        }
        if (!delivery.deliverOnlyVerifiedPurchases) {
          errors.push("Digital Delivery Worker must deliver only verified purchases");
        }
        if (!delivery.protectCustomerAccess) {
          errors.push("Digital Delivery Worker must protect customer access");
        }
        if (!delivery.preserveCompleteFulfilmentTraceability) {
          errors.push("Digital Delivery Worker must preserve complete fulfilment traceability");
        }
        if (!delivery.validateSuccessfulDelivery) {
          errors.push("Digital Delivery Worker must validate successful delivery");
        }
        if (!delivery.preserveAuditHistory) {
          errors.push("Digital Delivery Worker must preserve audit history");
        }
        if (!delivery.eligibilityVerified) {
          warnings.push(`Delivery ${delivery.deliveryId} eligibility not yet verified`);
        }
        if (!delivery.fulfilmentReady) {
          warnings.push(`Delivery ${delivery.deliveryId} fulfilment not yet ready`);
        }
        if (!delivery.selfReviewPassed) {
          warnings.push(`Delivery ${delivery.deliveryId} self-review did not fully pass`);
        }
        if (delivery.researchCompliance === "non_compliant") {
          warnings.push(
            `Delivery ${delivery.deliveryId} research compliance is non_compliant`,
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
    decision: DigitalDeliveryWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): DigitalDeliveryWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `ddw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DDW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.processPayments === true ||
      input.createProducts === true ||
      input.publishStorefronts === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ511OrLater === true ||
      input.exposeUnauthorizedAccess === true ||
      input.bypassPillowGovernance === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.processPayments) {
      errors.push("Digital Delivery Worker must never process payments");
    }
    if (input.createProducts) {
      errors.push("Digital Delivery Worker must never create products");
    }
    if (input.publishStorefronts) {
      errors.push("Digital Delivery Worker must never publish storefronts");
    }
    if (input.overridePillow) {
      errors.push("Digital Delivery Worker must never override Pillow");
    }
    if (input.overrideGrandKing) {
      errors.push("Digital Delivery Worker must never override Grand King");
    }
    if (input.implementQ511OrLater) {
      errors.push("Digital Delivery Worker must never implement Q5-11 or later");
    }
    if (input.exposeUnauthorizedAccess) {
      errors.push("Digital Delivery Worker must never expose unauthorized access");
    }
    if (input.bypassPillowGovernance) {
      errors.push("Digital Delivery Worker must never bypass Pillow governance");
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
