import { MAW_METADATA_VERSION } from "./paths.js";
import type {
  MediaAnalyticsReport,
  MediaAnalyticsWorkerInput,
  MediaAnalyticsWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  rewriteContent?: boolean;
  changePublishingSchedules?: boolean;
  modifyChannelStrategy?: boolean;
  executeOptimizations?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ416OrLater?: boolean;
  alterSourceAnalyticsData?: boolean;
  validated?: boolean;
};

export class AnalyticsValidator {
  decide(input: MediaAnalyticsWorkerInput): MediaAnalyticsWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateAnalyticsReports(
    reports: MediaAnalyticsReport[] | null,
    input: MediaAnalyticsWorkerInput,
    started: number,
  ): MediaAnalyticsWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Media Analytics Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No media analytics reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.analyticsReportId) errors.push("Missing analytics report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.mediaBusinessId) errors.push("Missing media business ID");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.mediaId) errors.push("Missing media ID");
        if (!report.platform) errors.push("Missing platform");
        if (!report.views) errors.push("Missing views");
        if (!report.impressions) errors.push("Missing impressions");
        if (!report.clickThroughRate) errors.push("Missing click-through rate");
        if (!report.watchTime) errors.push("Missing watch time");
        if (!report.retentionMetrics) errors.push("Missing retention metrics");
        if (!report.subscriberImpact) errors.push("Missing subscriber impact");
        if (!report.engagementMetrics) errors.push("Missing engagement metrics");
        if (!report.revenueMetrics) errors.push("Missing revenue metrics");
        // Empty-array trap: performancePatterns must have length >= 1
        if (!report.performancePatterns || report.performancePatterns.length < 1) {
          errors.push("Missing performance patterns");
        }
        if (report.confidenceScore == null || Number.isNaN(report.confidenceScore)) {
          errors.push("Missing confidence score");
        } else if (report.confidenceScore < 40) {
          warnings.push(
            `Analytics report ${report.analyticsReportId} confidenceScore ${report.confidenceScore} is below 40`,
          );
        }
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverRewriteContent) {
          errors.push("Media Analytics Worker must never rewrite content");
        }
        if (!report.neverChangePublishingSchedules) {
          errors.push("Media Analytics Worker must never change publishing schedules");
        }
        if (!report.neverModifyChannelStrategy) {
          errors.push("Media Analytics Worker must never modify channel strategy");
        }
        if (!report.neverExecuteOptimizations) {
          errors.push("Media Analytics Worker must never execute optimizations");
        }
        if (!report.neverOverridePillow) {
          errors.push("Media Analytics Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Media Analytics Worker must never override Grand King");
        }
        if (!report.neverImplementQ416OrLater) {
          errors.push("Media Analytics Worker must never implement Q4-16 or later");
        }
        if (!report.neverAlterSourceAnalyticsData) {
          errors.push("Media Analytics Worker must never alter source analytics data");
        }
        if (!report.preserveCompleteMetricTraceability) {
          errors.push("Media Analytics Worker must preserve complete metric traceability");
        }
        if (!report.preserveHistoricalPerformanceRecords) {
          errors.push("Media Analytics Worker must preserve historical performance records");
        }
        if (!report.distinguishPlatformReportedFromEstimates) {
          errors.push(
            "Media Analytics Worker must distinguish platform-reported metrics from estimates",
          );
        }
        if (!report.detectMeaningfulPerformanceChanges) {
          errors.push("Media Analytics Worker must detect meaningful performance changes");
        }
        if (!report.preserveAuditHistory) {
          errors.push("Media Analytics Worker must preserve audit history");
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
    decision: MediaAnalyticsWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MediaAnalyticsWorkerValidationReport {
    return {
      validationReportId: `maw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MAW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.rewriteContent === true ||
      input.changePublishingSchedules === true ||
      input.modifyChannelStrategy === true ||
      input.executeOptimizations === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ416OrLater === true ||
      input.alterSourceAnalyticsData === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.rewriteContent) {
      errors.push("Media Analytics Worker must never rewrite content");
    }
    if (input.changePublishingSchedules) {
      errors.push("Media Analytics Worker must never change publishing schedules");
    }
    if (input.modifyChannelStrategy) {
      errors.push("Media Analytics Worker must never modify channel strategy");
    }
    if (input.executeOptimizations) {
      errors.push("Media Analytics Worker must never execute optimizations");
    }
    if (input.overridePillow) errors.push("Media Analytics Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Media Analytics Worker must never override Grand King");
    }
    if (input.implementQ416OrLater) {
      errors.push("Media Analytics Worker must never implement Q4-16 or later");
    }
    if (input.alterSourceAnalyticsData) {
      errors.push("Media Analytics Worker must never alter source analytics data");
    }
  }
}

export class HealthMonitor {
  status(
    validationDecision: "pass" | "fail",
    enabled: boolean,
  ): "healthy" | "degraded" | "failed" | "standby" {
    if (!enabled) return "standby";
    if (validationDecision === "fail") return "failed";
    return "healthy";
  }
}

export class RecoveryManager {
  private failures = 0;

  recordFailure() {
    this.failures += 1;
  }

  reset() {
    this.failures = 0;
  }

  getFailureCount() {
    return this.failures;
  }
}
