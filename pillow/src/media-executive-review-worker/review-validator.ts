import { EXECUTIVE_RECOMMENDATIONS, MER_METADATA_VERSION } from "./paths.js";
import type {
  MediaExecutiveReviewReport,
  MediaExecutiveReviewWorkerInput,
  MediaExecutiveReviewWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  publishMedia?: boolean;
  rewriteScripts?: boolean;
  editMediaAssets?: boolean;
  modifyApprovedAssets?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ419OrLater?: boolean;
  bypassPillowGovernance?: boolean;
  validated?: boolean;
};

export class ReviewValidator {
  decide(input: MediaExecutiveReviewWorkerInput): MediaExecutiveReviewWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReviewReports(
    reports: MediaExecutiveReviewReport[] | null,
    input: MediaExecutiveReviewWorkerInput,
    started: number,
  ): MediaExecutiveReviewWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Media Executive Review Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No media executive review reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.reviewId) errors.push("Missing review ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.mediaId) errors.push("Missing media ID");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.editorialStatus) errors.push("Missing editorial status");
        if (!report.assetCompleteness) errors.push("Missing asset completeness");
        if (!report.qualityAssessment) errors.push("Missing quality assessment");
        if (!report.complianceAssessment) errors.push("Missing compliance assessment");
        // Empty-array trap: outstandingIssues must be present (may be empty)
        if (!Array.isArray(report.outstandingIssues)) {
          errors.push("Missing outstanding issues array");
        }
        if (
          !report.executiveRecommendation ||
          !(EXECUTIVE_RECOMMENDATIONS as readonly string[]).includes(
            report.executiveRecommendation,
          )
        ) {
          errors.push("Executive recommendation must be Approve, Revise, or Reject");
        }
        if (!report.recommendationRationale?.trim()) {
          errors.push("Missing recommendation rationale");
        }
        // Empty-array trap: supportingEvidence
        if (!report.supportingEvidence || report.supportingEvidence.length < 1) {
          errors.push("Missing supporting evidence");
        }
        if (report.confidenceScore == null || Number.isNaN(report.confidenceScore)) {
          errors.push("Missing confidence score");
        } else if (report.confidenceScore < 40) {
          warnings.push(
            `Review report ${report.reviewId} confidenceScore ${report.confidenceScore} is below 40`,
          );
        }
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverPublishMedia) {
          errors.push("Media Executive Review Worker must never publish media");
        }
        if (!report.neverBypassPillowGovernance) {
          errors.push("Media Executive Review Worker must never bypass Pillow governance");
        }
        if (!report.neverRewriteScripts) {
          errors.push("Media Executive Review Worker must never rewrite scripts");
        }
        if (!report.neverEditMediaAssets) {
          errors.push("Media Executive Review Worker must never edit media assets");
        }
        if (!report.neverModifyApprovedAssets) {
          errors.push("Media Executive Review Worker must never modify approved assets");
        }
        if (!report.neverOverridePillow) {
          errors.push("Media Executive Review Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Media Executive Review Worker must never override Grand King");
        }
        if (!report.neverImplementQ419OrLater) {
          errors.push("Media Executive Review Worker must never implement Q4-19 or later");
        }
        if (!report.verifyAllPrerequisiteWorkersCompletedSuccessfully) {
          errors.push(
            "Media Executive Review Worker must verify all prerequisite workers completed successfully",
          );
        }
        if (!report.preserveCompleteTraceability) {
          errors.push("Media Executive Review Worker must preserve complete traceability");
        }
        if (!report.distinguishVerifiedFindingsFromRecommendations) {
          errors.push(
            "Media Executive Review Worker must distinguish verified findings from recommendations",
          );
        }
        if (!report.preserveAuditHistory) {
          errors.push("Media Executive Review Worker must preserve audit history");
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
    decision: MediaExecutiveReviewWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MediaExecutiveReviewWorkerValidationReport {
    return {
      validationReportId: `mer-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MER_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.publishMedia === true ||
      input.rewriteScripts === true ||
      input.editMediaAssets === true ||
      input.modifyApprovedAssets === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ419OrLater === true ||
      input.bypassPillowGovernance === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.publishMedia) {
      errors.push("Media Executive Review Worker must never publish media");
    }
    if (input.rewriteScripts) {
      errors.push("Media Executive Review Worker must never rewrite scripts");
    }
    if (input.editMediaAssets) {
      errors.push("Media Executive Review Worker must never edit media assets");
    }
    if (input.modifyApprovedAssets) {
      errors.push("Media Executive Review Worker must never modify approved assets");
    }
    if (input.overridePillow) {
      errors.push("Media Executive Review Worker must never override Pillow");
    }
    if (input.overrideGrandKing) {
      errors.push("Media Executive Review Worker must never override Grand King");
    }
    if (input.implementQ419OrLater) {
      errors.push("Media Executive Review Worker must never implement Q4-19 or later");
    }
    if (input.bypassPillowGovernance) {
      errors.push("Media Executive Review Worker must never bypass Pillow governance");
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
