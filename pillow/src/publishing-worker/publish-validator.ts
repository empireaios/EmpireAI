import { PBW_METADATA_VERSION } from "./paths.js";
import type {
  PublishingReport,
  PublishingWorkerInput,
  PublishingWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  automaticallyPublishContent?: boolean;
  modifyApprovedMediaAssets?: boolean;
  overrideApprovalWorkflows?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ415OrLater?: boolean;
  validated?: boolean;
};

export class PublishValidator {
  decide(input: PublishingWorkerInput): PublishingWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validatePublishingReports(
    reports: PublishingReport[] | null,
    input: PublishingWorkerInput,
    started: number,
  ): PublishingWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Publishing Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No publishing reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.publishingReportId) errors.push("Missing publishing report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.mediaId) errors.push("Missing media ID");
        if (!report.targetPlatform) errors.push("Missing target platform");
        if (!report.videoTitle) errors.push("Missing video title");
        if (!report.description) errors.push("Missing description");
        if (!report.tags?.length) errors.push("Missing tags");
        if (!report.thumbnailReference) errors.push("Missing thumbnail reference");
        if (!report.playlist) errors.push("Missing playlist");
        if (!report.scheduledPublishTime) errors.push("Missing scheduled publish time");
        if (!report.uploadPackage) errors.push("Missing upload package");
        if (!report.publishingReadiness) errors.push("Missing publishing readiness");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverAutomaticallyPublishContent) {
          errors.push("Publishing Worker must never automatically publish content");
        }
        if ((report.automaticallyPublishAuthorized as boolean) !== false) {
          errors.push("Publishing Worker must never authorize automatic publishing");
        }
        if (!report.neverModifyApprovedMediaAssets) {
          errors.push("Publishing Worker must never modify approved media assets");
        }
        if (!report.neverOverrideApprovalWorkflows) {
          errors.push("Publishing Worker must never override approval workflows");
        }
        if (!report.neverOverridePillow) {
          errors.push("Publishing Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Publishing Worker must never override Grand King");
        }
        if (!report.neverImplementQ415OrLater) {
          errors.push("Publishing Worker must never implement Q4-15 or later");
        }
        if (!report.preserveCompleteAssetTraceability) {
          errors.push("Publishing Worker must preserve complete asset traceability");
        }
        if (!report.preservePublishingMetadataHistory) {
          errors.push("Publishing Worker must preserve publishing metadata history");
        }
        if (!report.validatePlatformRequirements) {
          errors.push("Publishing Worker must validate platform requirements");
        }
        if (!report.validateApprovalStatusBeforePublication) {
          errors.push("Publishing Worker must validate approval status before publication");
        }
        if (!report.preserveAuditHistory) {
          errors.push("Publishing Worker must preserve audit history");
        }
        if (report.approvalStatus === "rejected") {
          errors.push(`Publishing report ${report.publishingReportId} approval was rejected`);
        } else if (report.publishingReadiness.status === "blocked") {
          warnings.push(`Publishing report ${report.publishingReportId} readiness is blocked`);
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
    decision: PublishingWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PublishingWorkerValidationReport {
    return {
      validationReportId: `pbw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PBW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.automaticallyPublishContent === true ||
      input.modifyApprovedMediaAssets === true ||
      input.overrideApprovalWorkflows === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ415OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.automaticallyPublishContent) {
      errors.push("Publishing Worker must never automatically publish content");
    }
    if (input.modifyApprovedMediaAssets) {
      errors.push("Publishing Worker must never modify approved media assets");
    }
    if (input.overrideApprovalWorkflows) {
      errors.push("Publishing Worker must never override approval workflows");
    }
    if (input.overridePillow) errors.push("Publishing Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Publishing Worker must never override Grand King");
    }
    if (input.implementQ415OrLater) {
      errors.push("Publishing Worker must never implement Q4-15 or later");
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
