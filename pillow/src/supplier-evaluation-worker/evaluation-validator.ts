import { SEW_METADATA_VERSION } from "./paths.js";
import type {
  SupplierEvaluationReport,
  SupplierEvaluationWorkerInput,
  SupplierEvaluationWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  discoverSuppliers?: boolean;
  negotiateSuppliers?: boolean;
  placeSupplierOrders?: boolean;
  modifySupplierInformation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ306OrLater?: boolean;
  validated?: boolean;
};

export class EvaluationValidator {
  decide(
    input: SupplierEvaluationWorkerInput,
  ): SupplierEvaluationWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateEvaluations(
    evaluations: SupplierEvaluationReport[] | null,
    input: SupplierEvaluationWorkerInput,
    started: number,
  ): SupplierEvaluationWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Supplier Evaluation Worker requires validated=true");
    }

    if (!evaluations || evaluations.length === 0) {
      if (decision !== "fail") {
        warnings.push("No supplier evaluations were produced yet");
      }
    } else {
      for (const evaluation of evaluations) {
        if (!evaluation.evaluationId) errors.push("Missing evaluation ID");
        if (!evaluation.timestamp) errors.push("Missing timestamp");
        if (!evaluation.supplierId) errors.push("Missing supplier ID");
        if (!evaluation.supplierName?.trim()) errors.push("Missing supplier name");
        if (!evaluation.productId) errors.push("Missing product ID");
        for (const key of [
          "reliabilityScore",
          "priceScore",
          "shippingScore",
          "refundPolicyScore",
          "fulfilmentQualityScore",
          "communicationScore",
          "riskScore",
          "overallScore",
          "confidenceScore",
        ] as const) {
          if (evaluation[key] == null) errors.push(`Missing ${key}`);
        }
        if (!evaluation.recommendation) errors.push("Missing recommendation");
        if (!evaluation.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!evaluation.metadataVersion) errors.push("Missing metadata version");
        if (!evaluation.neverDiscoverSuppliers) {
          errors.push("Supplier Evaluation Worker must never discover suppliers");
        }
        if (!evaluation.neverNegotiateSuppliers) {
          errors.push("Supplier Evaluation Worker must never negotiate suppliers");
        }
        if (!evaluation.neverPlaceSupplierOrders) {
          errors.push("Supplier Evaluation Worker must never place supplier orders");
        }
        if (!evaluation.neverModifySupplierInformation) {
          errors.push("Supplier Evaluation Worker must never modify supplier information");
        }
        if (!evaluation.neverImplementQ306OrLater) {
          errors.push("Supplier Evaluation Worker must never implement Q3-06 or later");
        }
        if (!evaluation.discoveryId) {
          warnings.push(`Evaluation ${evaluation.evaluationId} missing discovery traceability`);
        }
        if (!evaluation.facts.length && !evaluation.assumptions.length) {
          warnings.push(
            `Evaluation ${evaluation.evaluationId} has no fact/assumption classification`,
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
      input.discoverSuppliers === true ||
      input.negotiateSuppliers === true ||
      input.placeSupplierOrders === true ||
      input.modifySupplierInformation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ306OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.discoverSuppliers === true) {
      errors.push("Supplier Evaluation Worker must never discover suppliers");
    }
    if (input.negotiateSuppliers === true) {
      errors.push("Supplier Evaluation Worker must never negotiate suppliers");
    }
    if (input.placeSupplierOrders === true) {
      errors.push("Supplier Evaluation Worker must never place supplier orders");
    }
    if (input.modifySupplierInformation === true) {
      errors.push("Supplier Evaluation Worker must never modify supplier information");
    }
    if (input.overridePillow === true) {
      errors.push("Supplier Evaluation Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Supplier Evaluation Worker must never override Grand King");
    }
    if (input.implementQ306OrLater === true) {
      errors.push("Supplier Evaluation Worker must never implement Q3-06 or later");
    }
  }

  finalize(
    decision: SupplierEvaluationWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SupplierEvaluationWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `sew-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SEW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: SupplierEvaluationWorkerValidationReport["decision"] | null,
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
