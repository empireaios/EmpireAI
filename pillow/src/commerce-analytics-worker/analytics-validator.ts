import { CAW_METADATA_VERSION } from "./paths.js";
import type {
  CommerceAnalyticsReport,
  CommerceAnalyticsWorkerInput,
  CommerceAnalyticsWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  modifyProducts?: boolean;
  modifyPricing?: boolean;
  modifySuppliers?: boolean;
  executeOptimizations?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ314OrLater?: boolean;
  modifyOperationalData?: boolean;
  validated?: boolean;
};

export class AnalyticsValidator {
  decide(
    input: CommerceAnalyticsWorkerInput,
  ): CommerceAnalyticsWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: CommerceAnalyticsReport[] | null,
    input: CommerceAnalyticsWorkerInput,
    started: number,
  ): CommerceAnalyticsWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Commerce Analytics Worker requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No commerce analytics reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.analyticsReportId) errors.push("Missing analytics report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.businessId) errors.push("Missing business ID");
        if (!report.productId) errors.push("Missing product ID");
        if (!report.salesMetrics) errors.push("Missing sales metrics");
        if (!report.conversionMetrics) errors.push("Missing conversion metrics");
        if (!report.profitMetrics) errors.push("Missing profit metrics");
        if (!report.productPerformanceClassification) {
          errors.push("Missing product performance classification");
        }
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!report.neverModifyProducts) {
          errors.push("Commerce Analytics Worker must never modify products");
        }
        if (!report.neverModifyPricing) {
          errors.push("Commerce Analytics Worker must never modify pricing");
        }
        if (!report.neverModifySuppliers) {
          errors.push("Commerce Analytics Worker must never modify suppliers");
        }
        if (!report.neverExecuteOptimizations) {
          errors.push("Commerce Analytics Worker must never execute optimizations");
        }
        if (!report.neverOverridePillow) {
          errors.push("Commerce Analytics Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Commerce Analytics Worker must never override Grand King");
        }
        if (!report.neverImplementQ314OrLater) {
          errors.push("Commerce Analytics Worker must never implement Q3-14 or later");
        }
        if (!report.neverModifyOperationalData) {
          errors.push("Commerce Analytics Worker must never modify operational data");
        }
        if (report.productPerformanceClassification === "declining") {
          warnings.push(
            `Report ${report.analyticsReportId} classified as declining — advisory review recommended`,
          );
        }
        if (report.productPerformanceClassification === "insufficient_data") {
          warnings.push(
            `Report ${report.analyticsReportId} has insufficient measured analytics data`,
          );
        }
        if (
          report.improvementOpportunities.some(
            (o) => o.severity === "critical" || o.severity === "warning",
          )
        ) {
          warnings.push(
            `Report ${report.analyticsReportId} has warning/critical improvement opportunities`,
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
      input.modifyProducts === true ||
      input.modifyPricing === true ||
      input.modifySuppliers === true ||
      input.executeOptimizations === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ314OrLater === true ||
      input.modifyOperationalData === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.modifyProducts === true) {
      errors.push("Commerce Analytics Worker must never modify products");
    }
    if (input.modifyPricing === true) {
      errors.push("Commerce Analytics Worker must never modify pricing");
    }
    if (input.modifySuppliers === true) {
      errors.push("Commerce Analytics Worker must never modify suppliers");
    }
    if (input.executeOptimizations === true) {
      errors.push("Commerce Analytics Worker must never execute optimizations");
    }
    if (input.overridePillow === true) {
      errors.push("Commerce Analytics Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Commerce Analytics Worker must never override Grand King");
    }
    if (input.implementQ314OrLater === true) {
      errors.push("Commerce Analytics Worker must never implement Q3-14 or later");
    }
    if (input.modifyOperationalData === true) {
      errors.push("Commerce Analytics Worker must never modify operational data");
    }
  }

  finalize(
    decision: CommerceAnalyticsWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CommerceAnalyticsWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `caw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CAW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: CommerceAnalyticsWorkerValidationReport["decision"] | null,
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
