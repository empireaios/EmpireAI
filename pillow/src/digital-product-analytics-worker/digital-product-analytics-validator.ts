import { DPA_METADATA_VERSION } from "./paths.js";
import type {
  DigitalProductAnalyticsReport,
  DigitalProductAnalyticsWorkerInput,
  DigitalProductAnalyticsWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  editProducts?: boolean;
  modifyProducts?: boolean;
  processPayments?: boolean;
  deliverProducts?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ512OrLater?: boolean;
  fabricateMetrics?: boolean;
  validated?: boolean;
};

export class DigitalProductAnalyticsValidator {
  decide(
    input: DigitalProductAnalyticsWorkerInput,
  ): DigitalProductAnalyticsWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateAnalyticsReports(
    reports: DigitalProductAnalyticsReport[] | null,
    input: DigitalProductAnalyticsWorkerInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): DigitalProductAnalyticsWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteReport === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Digital Product Analytics Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No analytics reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.analyticsReportId) errors.push("Missing analytics report ID");
        if (report.analyticsReportId && !report.analyticsReportId.startsWith("dpa-anl-")) {
          errors.push("Analytics report ID must start with dpa-anl-");
        }
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.productId) errors.push("Missing product ID");
        if (!report.productTitle?.trim()) errors.push("Missing product title");
        if (!report.salesMetrics) errors.push("Missing sales metrics");
        if (!report.revenueMetrics) errors.push("Missing revenue metrics");
        if (!report.profitMetrics) errors.push("Missing profit metrics");
        if (!report.conversionMetrics) errors.push("Missing conversion metrics");
        if (!report.refundMetrics) errors.push("Missing refund metrics");
        if (!report.customerFeedbackSummary) errors.push("Missing customer feedback summary");
        if (!incompleteOk && !report.executiveSummary?.trim()) {
          errors.push("Missing executive summary");
        }
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        for (const rec of report.improvementRecommendations) {
          if (!rec.isRecommendation) {
            errors.push("Recommendations must have isRecommendation:true");
          }
          if (!rec.recommendationId.startsWith("dpa-rec-")) {
            warnings.push(`Recommendation ID ${rec.recommendationId} should start with dpa-rec-`);
          }
        }
        if (!report.neverEditProducts) {
          errors.push("Digital Product Analytics Worker must never edit products");
        }
        if (!report.neverProcessPayments) {
          errors.push("Digital Product Analytics Worker must never process payments");
        }
        if (!report.neverDeliverProducts) {
          errors.push("Digital Product Analytics Worker must never deliver products");
        }
        if (!report.neverOverridePillow) {
          errors.push("Digital Product Analytics Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Digital Product Analytics Worker must never override Grand King");
        }
        if (!report.neverImplementQ512OrLater) {
          errors.push("Digital Product Analytics Worker must never implement Q5-12 or later");
        }
        if (!report.neverFabricateMetrics) {
          errors.push("Digital Product Analytics Worker must never fabricate metrics");
        }
        if (!report.preserveCompleteDataTraceability) {
          errors.push("Digital Product Analytics Worker must preserve complete data traceability");
        }
        if (!report.distinguishMeasuredDataFromRecommendations) {
          errors.push(
            "Digital Product Analytics Worker must distinguish measured data from recommendations",
          );
        }
        if (!report.preserveHistoricalAnalytics) {
          errors.push("Digital Product Analytics Worker must preserve historical analytics");
        }
        if (!report.preserveAuditHistory) {
          errors.push("Digital Product Analytics Worker must preserve audit history");
        }
        if (
          !report.salesMetrics.measured &&
          !report.revenueMetrics.measured &&
          !report.conversionMetrics.measured &&
          !report.refundMetrics.measured
        ) {
          warnings.push(
            `Report ${report.analyticsReportId} has no measured metrics — structural zeros only`,
          );
        }
        if (!report.selfReviewPassed) {
          warnings.push(`Report ${report.analyticsReportId} self-review did not fully pass`);
        }
        if (report.researchCompliance === "non_compliant") {
          warnings.push(
            `Report ${report.analyticsReportId} research compliance is non_compliant`,
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
    decision: DigitalProductAnalyticsWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): DigitalProductAnalyticsWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `dpa-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DPA_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.editProducts === true ||
      input.modifyProducts === true ||
      input.processPayments === true ||
      input.deliverProducts === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ512OrLater === true ||
      input.fabricateMetrics === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.editProducts) {
      errors.push("Digital Product Analytics Worker must never edit products");
    }
    if (input.modifyProducts) {
      errors.push("Digital Product Analytics Worker must never modify products");
    }
    if (input.processPayments) {
      errors.push("Digital Product Analytics Worker must never process payments");
    }
    if (input.deliverProducts) {
      errors.push("Digital Product Analytics Worker must never deliver products");
    }
    if (input.overridePillow) {
      errors.push("Digital Product Analytics Worker must never override Pillow");
    }
    if (input.overrideGrandKing) {
      errors.push("Digital Product Analytics Worker must never override Grand King");
    }
    if (input.implementQ512OrLater) {
      errors.push("Digital Product Analytics Worker must never implement Q5-12 or later");
    }
    if (input.fabricateMetrics) {
      errors.push("Digital Product Analytics Worker must never fabricate metrics");
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
