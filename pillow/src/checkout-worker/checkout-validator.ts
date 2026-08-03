import { CKW_METADATA_VERSION } from "./paths.js";
import type {
  CheckoutReport,
  CheckoutWorkerInput,
  CheckoutWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  chargeCustomers?: boolean;
  executePaymentTransactions?: boolean;
  processPayments?: boolean;
  deliverProducts?: boolean;
  publishStorefronts?: boolean;
  storeSensitivePaymentCredentials?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ510OrLater?: boolean;
  validated?: boolean;
};

export class CheckoutValidator {
  decide(input: CheckoutWorkerInput): CheckoutWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateCheckouts(
    checkouts: CheckoutReport[] | null,
    input: CheckoutWorkerInput,
    started: number,
    options: { allowIncompleteCheckout?: boolean } = {},
  ): CheckoutWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteCheckout === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Checkout Worker requires validated=true");
    }
    if (!checkouts || checkouts.length === 0) {
      if (decision !== "fail") {
        warnings.push("No checkouts were produced yet");
      }
    } else {
      for (const checkout of checkouts) {
        if (!checkout.checkoutId) errors.push("Missing checkout ID");
        if (checkout.checkoutId && !checkout.checkoutId.startsWith("ckw-chk-")) {
          errors.push("Checkout ID must start with ckw-chk-");
        }
        if (!checkout.timestamp) errors.push("Missing timestamp");
        if (!checkout.productId) errors.push("Missing product ID");
        if (checkout.productId && !checkout.productId.startsWith("ckw-prd-")) {
          warnings.push("Product ID should start with ckw-prd-");
        }
        if (!checkout.productTitle?.trim()) errors.push("Missing product title");
        if (!checkout.checkoutFlowType) errors.push("Missing checkout flow type");
        if (!incompleteOk && !checkout.checkoutFlow.steps.length) {
          errors.push("Missing checkout workflow steps");
        }
        if (!incompleteOk && !checkout.paymentProviderConfiguration) {
          errors.push("Missing payment provider configuration");
        }
        if (!incompleteOk && !checkout.orderSummary?.lineItems.length) {
          errors.push("Missing order summary");
        }
        if (!incompleteOk && !checkout.customerInformationRequirements.length) {
          errors.push("Missing customer information requirements");
        }
        if (!incompleteOk && !checkout.complianceReview?.trim()) {
          errors.push("Missing compliance review");
        }
        if (!incompleteOk && !checkout.qualityReview?.trim()) {
          errors.push("Missing quality review");
        }
        if (checkout.confidenceScore == null) errors.push("Missing confidence score");
        if (!checkout.metadataVersion) errors.push("Missing metadata version");
        if (checkout.paymentProviderConfiguration?.apiKeyPresent) {
          errors.push("Payment provider configuration must never include API keys");
        }
        if (checkout.paymentProviderConfiguration?.secretsPresent) {
          errors.push("Payment provider configuration must never include secrets");
        }
        if (!checkout.neverChargeCustomers) {
          errors.push("Checkout Worker must never charge customers");
        }
        if (!checkout.neverExecutePaymentTransactions) {
          errors.push("Checkout Worker must never execute payment transactions");
        }
        if (!checkout.neverDeliverProducts) {
          errors.push("Checkout Worker must never deliver products");
        }
        if (!checkout.neverPublishStorefronts) {
          errors.push("Checkout Worker must never publish storefronts");
        }
        if (!checkout.neverStoreSensitivePaymentCredentials) {
          errors.push("Checkout Worker must never store sensitive payment credentials");
        }
        if (!checkout.neverOverridePillow) {
          errors.push("Checkout Worker must never override Pillow");
        }
        if (!checkout.neverOverrideGrandKing) {
          errors.push("Checkout Worker must never override Grand King");
        }
        if (!checkout.neverImplementQ510OrLater) {
          errors.push("Checkout Worker must never implement Q5-10 or later");
        }
        if (!checkout.followApprovedProductInformation) {
          errors.push("Checkout Worker must follow approved product information");
        }
        if (!checkout.validateCheckoutIntegrityBeforeSubmission) {
          errors.push("Checkout Worker must validate checkout integrity before submission");
        }
        if (!checkout.checkoutFlow.steps.length) {
          warnings.push(`Checkout ${checkout.checkoutId} workflow not yet generated`);
        }
        if (!checkout.paymentProviderConfiguration) {
          warnings.push(
            `Checkout ${checkout.checkoutId} payment provider configuration not yet prepared`,
          );
        }
        if (!checkout.orderSummary?.lineItems.length) {
          warnings.push(`Checkout ${checkout.checkoutId} order summary not yet generated`);
        }
        if (!checkout.confirmationWorkflow?.steps.length) {
          warnings.push(
            `Checkout ${checkout.checkoutId} confirmation workflow not yet generated`,
          );
        }
        if (!checkout.customerInformationRequirements.length) {
          warnings.push(
            `Checkout ${checkout.checkoutId} purchase information not yet validated`,
          );
        }
        if (
          checkout.deliveryHandoffStatus !== "prepared" &&
          checkout.deliveryHandoffStatus !== "ready_for_handoff"
        ) {
          warnings.push(`Checkout ${checkout.checkoutId} handoff not yet prepared`);
        }
        if (!checkout.checkoutReady) {
          warnings.push(`Checkout ${checkout.checkoutId} readiness not yet validated`);
        }
        if (!checkout.selfReviewPassed) {
          warnings.push(`Checkout ${checkout.checkoutId} self-review did not fully pass`);
        }
        if (checkout.researchCompliance === "non_compliant") {
          warnings.push(
            `Checkout ${checkout.checkoutId} research compliance is non_compliant`,
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
    decision: CheckoutWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CheckoutWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `ckw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CKW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.chargeCustomers === true ||
      input.executePaymentTransactions === true ||
      input.processPayments === true ||
      input.deliverProducts === true ||
      input.publishStorefronts === true ||
      input.storeSensitivePaymentCredentials === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ510OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.chargeCustomers) errors.push("Checkout Worker must never charge customers");
    if (input.executePaymentTransactions) {
      errors.push("Checkout Worker must never execute payment transactions");
    }
    if (input.processPayments) {
      errors.push("Checkout Worker must never process payments");
    }
    if (input.deliverProducts) {
      errors.push("Checkout Worker must never deliver products");
    }
    if (input.publishStorefronts) {
      errors.push("Checkout Worker must never publish storefronts");
    }
    if (input.storeSensitivePaymentCredentials) {
      errors.push("Checkout Worker must never store sensitive payment credentials");
    }
    if (input.overridePillow) errors.push("Checkout Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Checkout Worker must never override Grand King");
    }
    if (input.implementQ510OrLater) {
      errors.push("Checkout Worker must never implement Q5-10 or later");
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
