import { SDW_METADATA_VERSION } from "./paths.js";
import type {
  SupplierDiscoveryReport,
  SupplierDiscoveryWorkerInput,
  SupplierDiscoveryWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  evaluateSuppliers?: boolean;
  negotiateSuppliers?: boolean;
  selectSuppliers?: boolean;
  placeOrders?: boolean;
  modifySupplierData?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ305OrLater?: boolean;
  validated?: boolean;
};

export class DiscoveryValidator {
  decide(input: SupplierDiscoveryWorkerInput): SupplierDiscoveryWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateDiscoveries(
    discoveries: SupplierDiscoveryReport[] | null,
    input: SupplierDiscoveryWorkerInput,
    started: number,
  ): SupplierDiscoveryWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Supplier Discovery Worker requires validated=true");
    }

    if (!discoveries || discoveries.length === 0) {
      if (decision !== "fail") {
        warnings.push("No supplier discoveries were produced yet");
      }
    } else {
      for (const discovery of discoveries) {
        if (!discovery.discoveryId) errors.push("Missing discovery ID");
        if (!discovery.timestamp) errors.push("Missing timestamp");
        if (!discovery.productId) errors.push("Missing product ID");
        if (!discovery.productName?.trim()) errors.push("Missing product name");
        if (!discovery.supplierId) errors.push("Missing supplier ID");
        if (!discovery.supplierName?.trim()) errors.push("Missing supplier name");
        if (!discovery.supplierPlatform) errors.push("Missing supplier platform");
        if (!discovery.sourceReference?.trim()) errors.push("Missing source reference");
        if (discovery.confidenceScore == null) errors.push("Missing confidence score");
        if (!discovery.metadataVersion) errors.push("Missing metadata version");
        if (!discovery.neverEvaluateSuppliers) {
          errors.push("Supplier Discovery Worker must never evaluate suppliers");
        }
        if (!discovery.neverNegotiateSuppliers) {
          errors.push("Supplier Discovery Worker must never negotiate suppliers");
        }
        if (!discovery.neverSelectSuppliers) {
          errors.push("Supplier Discovery Worker must never select suppliers");
        }
        if (!discovery.neverPlaceOrders) {
          errors.push("Supplier Discovery Worker must never place orders");
        }
        if (!discovery.neverModifySupplierData) {
          errors.push("Supplier Discovery Worker must never modify supplier data");
        }
        if (!discovery.neverImplementQ305OrLater) {
          errors.push("Supplier Discovery Worker must never implement Q3-05 or later");
        }
        if (!discovery.evaluationId) {
          warnings.push(`Discovery ${discovery.discoveryId} missing evaluation traceability`);
        }
        for (const [field, status] of Object.entries(discovery.fieldAvailability)) {
          if (status === "missing") {
            warnings.push(`Discovery ${discovery.discoveryId} field ${field} is missing`);
          } else if (status === "unavailable") {
            warnings.push(`Discovery ${discovery.discoveryId} field ${field} is unavailable`);
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
      input.evaluateSuppliers === true ||
      input.negotiateSuppliers === true ||
      input.selectSuppliers === true ||
      input.placeOrders === true ||
      input.modifySupplierData === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ305OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.evaluateSuppliers === true) {
      errors.push("Supplier Discovery Worker must never evaluate suppliers");
    }
    if (input.negotiateSuppliers === true) {
      errors.push("Supplier Discovery Worker must never negotiate suppliers");
    }
    if (input.selectSuppliers === true) {
      errors.push("Supplier Discovery Worker must never select suppliers");
    }
    if (input.placeOrders === true) {
      errors.push("Supplier Discovery Worker must never place orders");
    }
    if (input.modifySupplierData === true) {
      errors.push("Supplier Discovery Worker must never modify supplier data");
    }
    if (input.overridePillow === true) {
      errors.push("Supplier Discovery Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Supplier Discovery Worker must never override Grand King");
    }
    if (input.implementQ305OrLater === true) {
      errors.push("Supplier Discovery Worker must never implement Q3-05 or later");
    }
  }

  finalize(
    decision: SupplierDiscoveryWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SupplierDiscoveryWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `sdw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SDW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: SupplierDiscoveryWorkerValidationReport["decision"] | null,
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
