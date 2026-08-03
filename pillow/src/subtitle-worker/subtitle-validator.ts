import { STW_METADATA_VERSION } from "./paths.js";
import type {
  SubtitleReport,
  SubtitleWorkerInput,
  SubtitleWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  rewriteScripts?: boolean;
  assembleVideos?: boolean;
  publishContent?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ413OrLater?: boolean;
  modifyApprovedScripts?: boolean;
  validated?: boolean;
};

export class SubtitleValidator {
  decide(input: SubtitleWorkerInput): SubtitleWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateSubtitleReports(
    reports: SubtitleReport[] | null,
    input: SubtitleWorkerInput,
    started: number,
  ): SubtitleWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Subtitle Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No subtitle reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.subtitleReportId) errors.push("Missing subtitle report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.videoId) errors.push("Missing video ID");
        if (!report.scriptId) errors.push("Missing script ID");
        if (!report.transcript) errors.push("Missing transcript");
        if (!report.subtitleLanguage) errors.push("Missing subtitle language");
        if (!report.captionTimeline.length) errors.push("Missing caption timeline");
        if (!report.timingAccuracy) errors.push("Missing timing accuracy");
        if (!report.exportFormats.length) errors.push("Missing export formats");
        if (!report.qualityValidation) errors.push("Missing quality validation");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverRewriteScripts) {
          errors.push("Subtitle Worker must never rewrite scripts");
        }
        if (!report.neverAssembleVideos) {
          errors.push("Subtitle Worker must never assemble videos");
        }
        if (!report.neverPublishContent) {
          errors.push("Subtitle Worker must never publish content");
        }
        if (!report.neverOverridePillow) {
          errors.push("Subtitle Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Subtitle Worker must never override Grand King");
        }
        if (!report.neverImplementQ413OrLater) {
          errors.push("Subtitle Worker must never implement Q4-13 or later");
        }
        if (!report.neverModifyApprovedScripts) {
          errors.push("Subtitle Worker must never modify approved scripts");
        }
        if (!report.preserveScriptTraceability) {
          errors.push("Subtitle Worker must preserve script traceability");
        }
        if (!report.preserveSubtitleSynchronization) {
          errors.push("Subtitle Worker must preserve subtitle synchronization");
        }
        if (report.exportFormats.length < 2) {
          warnings.push(`Subtitle report ${report.subtitleReportId} has fewer than 2 export formats`);
        }
        if (report.qualityValidation.status === "fail") {
          warnings.push(`Subtitle report ${report.subtitleReportId} failed quality validation`);
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
    decision: SubtitleWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SubtitleWorkerValidationReport {
    return {
      validationReportId: `stw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: STW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.rewriteScripts === true ||
      input.assembleVideos === true ||
      input.publishContent === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ413OrLater === true ||
      input.modifyApprovedScripts === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.rewriteScripts) errors.push("Subtitle Worker must never rewrite scripts");
    if (input.assembleVideos) errors.push("Subtitle Worker must never assemble videos");
    if (input.publishContent || input.publishMedia) {
      errors.push("Subtitle Worker must never publish content");
    }
    if (input.overridePillow) errors.push("Subtitle Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Subtitle Worker must never override Grand King");
    if (input.implementQ413OrLater) {
      errors.push("Subtitle Worker must never implement Q4-13 or later");
    }
    if (input.modifyApprovedScripts) {
      errors.push("Subtitle Worker must never modify approved scripts");
    }
  }
}

export class HealthMonitor {
  status(validationDecision: "pass" | "fail", enabled: boolean): "healthy" | "degraded" | "failed" | "standby" {
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
