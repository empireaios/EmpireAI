import { PDW_METADATA_VERSION } from "./paths.js";
import type {
  ProductDiscoveryReport,
  ProductDiscoveryWorkerInput,
  ProductDiscoveryWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  evaluateProducts?: boolean;
  rankProducts?: boolean;
  selectSuppliers?: boolean;
  buildListings?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ303OrLater?: boolean;
  validated?: boolean;
};

export class DiscoveryValidator {
  decide(input: ProductDiscoveryWorkerInput): ProductDiscoveryWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateDiscoveries(
    discoveries: ProductDiscoveryReport[] | null,
    input: ProductDiscoveryWorkerInput,
    started: number,
  ): ProductDiscoveryWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Product Discovery Worker requires validated=true");
    }

    if (!discoveries || discoveries.length === 0) {
      if (decision !== "fail") {
        warnings.push("No product discoveries were produced yet");
      }
    } else {
      for (const discovery of discoveries) {
        if (!discovery.discoveryId) errors.push("Missing discovery ID");
        if (!discovery.timestamp) errors.push("Missing timestamp");
        if (!discovery.businessMissionId) errors.push("Missing business mission ID");
        if (!discovery.productId) errors.push("Missing product ID");
        if (!discovery.productName?.trim()) errors.push("Missing product name");
        if (!discovery.category) errors.push("Missing category");
        if (!discovery.discoverySource) errors.push("Missing discovery source");
        if (!discovery.discoveryReason?.trim()) errors.push("Missing discovery reason");
        if (discovery.confidenceScore == null) errors.push("Missing confidence score");
        if (!discovery.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!discovery.metadataVersion) errors.push("Missing metadata version");
        if (!discovery.neverEvaluateProducts) {
          errors.push("Product Discovery Worker must never evaluate products");
        }
        if (!discovery.neverRankProducts) {
          errors.push("Product Discovery Worker must never rank products");
        }
        if (!discovery.neverSelectSuppliers) {
          errors.push("Product Discovery Worker must never select suppliers");
        }
        if (!discovery.neverBuildListings) {
          errors.push("Product Discovery Worker must never build listings");
        }
        if (!discovery.neverImplementQ303OrLater) {
          errors.push("Product Discovery Worker must never implement Q3-03 or later");
        }
        if (!discovery.facts.length && !discovery.assumptions.length) {
          warnings.push(`Discovery ${discovery.discoveryId} has no fact/assumption classification`);
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
      input.evaluateProducts === true ||
      input.rankProducts === true ||
      input.selectSuppliers === true ||
      input.buildListings === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ303OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.evaluateProducts === true) {
      errors.push("Product Discovery Worker must never evaluate products");
    }
    if (input.rankProducts === true) {
      errors.push("Product Discovery Worker must never rank products");
    }
    if (input.selectSuppliers === true) {
      errors.push("Product Discovery Worker must never select suppliers");
    }
    if (input.buildListings === true) {
      errors.push("Product Discovery Worker must never build listings");
    }
    if (input.overridePillow === true) {
      errors.push("Product Discovery Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Product Discovery Worker must never override Grand King");
    }
    if (input.implementQ303OrLater === true) {
      errors.push("Product Discovery Worker must never implement Q3-03 or later");
    }
  }

  finalize(
    decision: ProductDiscoveryWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ProductDiscoveryWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `pdw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PDW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: ProductDiscoveryWorkerValidationReport["decision"] | null,
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
