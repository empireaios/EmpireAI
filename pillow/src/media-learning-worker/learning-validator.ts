import { MLW_METADATA_VERSION } from "./paths.js";
import type {
  MediaLearningReport,
  MediaLearningWorkerInput,
  MediaLearningWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  rewriteExistingContent?: boolean;
  modifyPublishedVideos?: boolean;
  changeEditorialPolicyDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ417OrLater?: boolean;
  overwriteHistoricalLearning?: boolean;
  verifiedAnalytics?: boolean;
  validated?: boolean;
};

export class LearningValidator {
  decide(input: MediaLearningWorkerInput): MediaLearningWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.verifiedAnalytics === false) return "fail";
    return "pass";
  }

  validateLearningReports(
    reports: MediaLearningReport[] | null,
    input: MediaLearningWorkerInput,
    started: number,
  ): MediaLearningWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Media Learning Worker requires validated=true");
    }
    if (input.verifiedAnalytics === false) {
      errors.push("Media Learning Worker requires verifiedAnalytics=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No media learning reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.learningReportId) errors.push("Missing learning report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.channelId) errors.push("Missing channel ID");
        // Empty-array trap: mediaIdsAnalysed
        if (!report.mediaIdsAnalysed || report.mediaIdsAnalysed.length < 1) {
          errors.push("Missing media IDs analysed");
        }
        // At least one pattern total (successful OR failed)
        const successLen = report.successfulPatterns?.length ?? 0;
        const failedLen = report.failedPatterns?.length ?? 0;
        if (successLen + failedLen < 1) {
          errors.push("Missing content patterns (successful or unsuccessful)");
        }
        if (!report.topicInsights) errors.push("Missing topic insights array");
        if (!report.hookInsights) errors.push("Missing hook insights array");
        if (!report.thumbnailInsights) errors.push("Missing thumbnail insights array");
        if (!report.retentionInsights) errors.push("Missing retention insights array");
        if (!report.publishingInsights) errors.push("Missing publishing insights array");
        // Empty-array trap: recommendedImprovements
        if (!report.recommendedImprovements || report.recommendedImprovements.length < 1) {
          errors.push("Missing recommended improvements");
        }
        if (report.confidenceScore == null || Number.isNaN(report.confidenceScore)) {
          errors.push("Missing confidence score");
        } else if (report.confidenceScore < 40) {
          warnings.push(
            `Learning report ${report.learningReportId} confidenceScore ${report.confidenceScore} is below 40`,
          );
        }
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverRewriteExistingContent) {
          errors.push("Media Learning Worker must never rewrite existing content");
        }
        if (!report.neverModifyPublishedVideos) {
          errors.push("Media Learning Worker must never modify published videos");
        }
        if (!report.neverChangeEditorialPolicyDirectly) {
          errors.push("Media Learning Worker must never change editorial policy directly");
        }
        if (!report.neverOverridePillow) {
          errors.push("Media Learning Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Media Learning Worker must never override Grand King");
        }
        if (!report.neverImplementQ417OrLater) {
          errors.push("Media Learning Worker must never implement Q4-17 or later");
        }
        if (!report.neverOverwriteHistoricalLearning) {
          errors.push("Media Learning Worker must never overwrite historical learning");
        }
        if (!report.learnOnlyFromVerifiedAnalytics) {
          errors.push("Media Learning Worker must learn only from verified analytics");
        }
        if (!report.preserveCompleteTraceability) {
          errors.push("Media Learning Worker must preserve complete traceability");
        }
        if (!report.preserveHistoricalLearningRecords) {
          errors.push("Media Learning Worker must preserve historical learning records");
        }
        if (!report.distinguishMeasuredOutcomesFromAssumptions) {
          errors.push(
            "Media Learning Worker must distinguish measured outcomes from assumptions",
          );
        }
        if (!report.preserveAuditHistory) {
          errors.push("Media Learning Worker must preserve audit history");
        }
        if (!report.verifiedAnalyticsOnly) {
          errors.push("Media Learning Worker must set verifiedAnalyticsOnly");
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
    decision: MediaLearningWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MediaLearningWorkerValidationReport {
    return {
      validationReportId: `mlw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MLW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.rewriteExistingContent === true ||
      input.modifyPublishedVideos === true ||
      input.changeEditorialPolicyDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ417OrLater === true ||
      input.overwriteHistoricalLearning === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.rewriteExistingContent) {
      errors.push("Media Learning Worker must never rewrite existing content");
    }
    if (input.modifyPublishedVideos) {
      errors.push("Media Learning Worker must never modify published videos");
    }
    if (input.changeEditorialPolicyDirectly) {
      errors.push("Media Learning Worker must never change editorial policy directly");
    }
    if (input.overridePillow) {
      errors.push("Media Learning Worker must never override Pillow");
    }
    if (input.overrideGrandKing) {
      errors.push("Media Learning Worker must never override Grand King");
    }
    if (input.implementQ417OrLater) {
      errors.push("Media Learning Worker must never implement Q4-17 or later");
    }
    if (input.overwriteHistoricalLearning) {
      errors.push("Media Learning Worker must never overwrite historical learning");
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
