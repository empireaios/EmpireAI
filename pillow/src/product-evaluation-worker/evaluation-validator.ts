import { PEW_METADATA_VERSION } from "./paths.js";
import type {
  ProductEvaluationReport,
  ProductEvaluationWorkerInput,
  ProductEvaluationWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  discoverProducts?: boolean;
  selectSuppliers?: boolean;
  createListings?: boolean;
  purchaseInventory?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ304OrLater?: boolean;
  validated?: boolean;
};

export class EvaluationValidator {
  decide(input: ProductEvaluationWorkerInput): ProductEvaluationWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateEvaluations(
    evaluations: ProductEvaluationReport[] | null,
    input: ProductEvaluationWorkerInput,
    started: number,
  ): ProductEvaluationWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Product Evaluation Worker requires validated=true");
    }

    if (!evaluations || evaluations.length === 0) {
      if (decision !== "fail") {
        warnings.push("No product evaluations were produced yet");
      }
    } else {
      for (const evaluation of evaluations) {
        if (!evaluation.evaluationId) errors.push("Missing evaluation ID");
        if (!evaluation.timestamp) errors.push("Missing timestamp");
        if (!evaluation.productId) errors.push("Missing product ID");
        if (!evaluation.productName?.trim()) errors.push("Missing product name");
        if (!evaluation.category) errors.push("Missing category");
        for (const key of [
          "marginScore",
          "demandScore",
          "competitionScore",
          "shippingScore",
          "riskScore",
          "reviewScore",
          "creativePotentialScore",
          "overallScore",
          "confidenceScore",
        ] as const) {
          if (evaluation[key] == null) errors.push(`Missing ${key}`);
        }
        if (!evaluation.recommendation) errors.push("Missing recommendation");
        if (!evaluation.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!evaluation.metadataVersion) errors.push("Missing metadata version");
        if (!evaluation.neverDiscoverProducts) {
          errors.push("Product Evaluation Worker must never discover products");
        }
        if (!evaluation.neverSelectSuppliers) {
          errors.push("Product Evaluation Worker must never select suppliers");
        }
        if (!evaluation.neverCreateListings) {
          errors.push("Product Evaluation Worker must never create listings");
        }
        if (!evaluation.neverPurchaseInventory) {
          errors.push("Product Evaluation Worker must never purchase inventory");
        }
        if (!evaluation.neverImplementQ304OrLater) {
          errors.push("Product Evaluation Worker must never implement Q3-04 or later");
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
      input.discoverProducts === true ||
      input.selectSuppliers === true ||
      input.createListings === true ||
      input.purchaseInventory === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ304OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.discoverProducts === true) {
      errors.push("Product Evaluation Worker must never discover products");
    }
    if (input.selectSuppliers === true) {
      errors.push("Product Evaluation Worker must never select suppliers");
    }
    if (input.createListings === true) {
      errors.push("Product Evaluation Worker must never create listings");
    }
    if (input.purchaseInventory === true) {
      errors.push("Product Evaluation Worker must never purchase inventory");
    }
    if (input.overridePillow === true) {
      errors.push("Product Evaluation Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Product Evaluation Worker must never override Grand King");
    }
    if (input.implementQ304OrLater === true) {
      errors.push("Product Evaluation Worker must never implement Q3-04 or later");
    }
  }

  finalize(
    decision: ProductEvaluationWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ProductEvaluationWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `pew-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PEW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: ProductEvaluationWorkerValidationReport["decision"] | null,
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
