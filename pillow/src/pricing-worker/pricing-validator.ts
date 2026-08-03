import { PRW_METADATA_VERSION } from "./paths.js";
import type {
  PricingReport,
  PricingWorkerInput,
  PricingWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  publishListings?: boolean;
  modifySupplierCosts?: boolean;
  executePromotions?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ310OrLater?: boolean;
  publishPricing?: boolean;
  validated?: boolean;
};

export class PricingValidator {
  decide(input: PricingWorkerInput): PricingWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: PricingReport[] | null,
    input: PricingWorkerInput,
    started: number,
  ): PricingWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Pricing Worker requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No pricing reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.pricingId) errors.push("Missing pricing ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.productId) errors.push("Missing product ID");
        if (report.supplierCost?.amount == null) errors.push("Missing supplier cost");
        if (report.shippingCost?.amount == null) errors.push("Missing shipping cost");
        if (report.marketplaceFees?.amount == null) errors.push("Missing marketplace fees");
        if (report.paymentFees?.amount == null) errors.push("Missing payment fees");
        if (report.advertisingAllocation?.amount == null) {
          errors.push("Missing advertising allocation");
        }
        if (report.totalLandedCost?.amount == null) errors.push("Missing total landed cost");
        if (report.targetMargin == null) errors.push("Missing target margin");
        if (report.targetProfit?.amount == null) errors.push("Missing target profit");
        if (report.recommendedSellingPrice == null) {
          errors.push("Missing recommended selling price");
        }
        if (!report.pricingRationale?.trim()) errors.push("Missing pricing rationale");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!report.neverPublishPricingAutomatically) {
          errors.push("Pricing Worker must never publish pricing automatically");
        }
        if (!report.neverModifySupplierCosts) {
          errors.push("Pricing Worker must never modify supplier costs");
        }
        if (!report.neverImplementQ310OrLater) {
          errors.push("Pricing Worker must never implement Q3-10 or later");
        }
        if (!report.supplierId && !report.listingId && !report.evaluationId) {
          warnings.push(`Pricing ${report.pricingId} missing product/supplier traceability`);
        }
        if (report.supplierCost.kind === "estimated" && report.supplierCost.amount === 0) {
          warnings.push(`Pricing ${report.pricingId} supplier cost is estimated at zero`);
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
      input.publishListings === true ||
      input.modifySupplierCosts === true ||
      input.executePromotions === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ310OrLater === true ||
      input.publishPricing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.publishListings === true) {
      errors.push("Pricing Worker must never publish listings");
    }
    if (input.modifySupplierCosts === true) {
      errors.push("Pricing Worker must never modify supplier costs");
    }
    if (input.executePromotions === true) {
      errors.push("Pricing Worker must never execute promotions");
    }
    if (input.overridePillow === true) {
      errors.push("Pricing Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Pricing Worker must never override Grand King");
    }
    if (input.implementQ310OrLater === true) {
      errors.push("Pricing Worker must never implement Q3-10 or later");
    }
    if (input.publishPricing === true) {
      errors.push("Pricing Worker must never publish pricing automatically");
    }
  }

  finalize(
    decision: PricingWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PricingWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `prw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PRW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: PricingWorkerValidationReport["decision"] | null, enabled: boolean) {
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
