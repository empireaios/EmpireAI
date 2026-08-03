import { SNW_METADATA_VERSION } from "./paths.js";
import type {
  SupplierNegotiationReport,
  SupplierNegotiationWorkerInput,
  SupplierNegotiationWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  contactSuppliers?: boolean;
  commitAgreements?: boolean;
  placeOrders?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ307OrLater?: boolean;
  validated?: boolean;
};

export class NegotiationValidator {
  decide(
    input: SupplierNegotiationWorkerInput,
  ): SupplierNegotiationWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateNegotiations(
    negotiations: SupplierNegotiationReport[] | null,
    input: SupplierNegotiationWorkerInput,
    started: number,
  ): SupplierNegotiationWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Supplier Negotiation Worker requires validated=true");
    }

    if (!negotiations || negotiations.length === 0) {
      if (decision !== "fail") {
        warnings.push("No supplier negotiations were produced yet");
      }
    } else {
      for (const negotiation of negotiations) {
        if (!negotiation.negotiationId) errors.push("Missing negotiation ID");
        if (!negotiation.timestamp) errors.push("Missing timestamp");
        if (!negotiation.productId) errors.push("Missing product ID");
        if (!negotiation.candidateSuppliers.length) {
          errors.push("Missing candidate suppliers");
        }
        if (!negotiation.comparisonSummary?.trim()) errors.push("Missing comparison summary");
        if (!negotiation.moqNegotiation?.questions?.length) {
          errors.push("Missing MOQ negotiation questions");
        }
        if (!negotiation.priceNegotiation?.questions?.length) {
          errors.push("Missing price negotiation questions");
        }
        if (!negotiation.shippingNegotiation?.questions?.length) {
          errors.push("Missing shipping negotiation questions");
        }
        if (!negotiation.fulfilmentQuestions?.questions?.length) {
          errors.push("Missing fulfilment questions");
        }
        if (!negotiation.refundQuestions?.questions?.length) {
          errors.push("Missing refund questions");
        }
        if (!negotiation.draftNegotiationMessage?.trim()) {
          errors.push("Missing draft negotiation message");
        }
        if (!negotiation.recommendation) errors.push("Missing recommendation");
        if (!negotiation.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!negotiation.metadataVersion) errors.push("Missing metadata version");
        if (!negotiation.neverContactSuppliers) {
          errors.push("Supplier Negotiation Worker must never contact suppliers");
        }
        if (!negotiation.neverCommitAgreements) {
          errors.push("Supplier Negotiation Worker must never commit agreements");
        }
        if (!negotiation.neverPlaceOrders) {
          errors.push("Supplier Negotiation Worker must never place orders");
        }
        if (!negotiation.neverImplementQ307OrLater) {
          errors.push("Supplier Negotiation Worker must never implement Q3-07 or later");
        }
        if (!negotiation.evaluationIds.length) {
          warnings.push(
            `Negotiation ${negotiation.negotiationId} missing evaluation traceability`,
          );
        }
        if (
          negotiation.draftNegotiationMessage.toLowerCase().includes("has not been sent") ===
            false &&
          negotiation.draftNegotiationMessage.toLowerCase().includes("not transmitted") === false
        ) {
          warnings.push(
            `Negotiation ${negotiation.negotiationId} draft should state it was not transmitted`,
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

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.contactSuppliers === true ||
      input.commitAgreements === true ||
      input.placeOrders === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ307OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.contactSuppliers === true) {
      errors.push("Supplier Negotiation Worker must never contact suppliers");
    }
    if (input.commitAgreements === true) {
      errors.push("Supplier Negotiation Worker must never commit agreements");
    }
    if (input.placeOrders === true) {
      errors.push("Supplier Negotiation Worker must never place orders");
    }
    if (input.overridePillow === true) {
      errors.push("Supplier Negotiation Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Supplier Negotiation Worker must never override Grand King");
    }
    if (input.implementQ307OrLater === true) {
      errors.push("Supplier Negotiation Worker must never implement Q3-07 or later");
    }
  }

  finalize(
    decision: SupplierNegotiationWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SupplierNegotiationWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `snw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SNW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: SupplierNegotiationWorkerValidationReport["decision"] | null,
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
