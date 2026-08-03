import { HKW_METADATA_VERSION } from "./paths.js";
import type {
  HookReport,
  HookWorkerInput,
  HookWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  rewriteCompleteScript?: boolean;
  generateThumbnails?: boolean;
  generateVideos?: boolean;
  publishContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ407OrLater?: boolean;
  useMisleadingHooks?: boolean;
  validated?: boolean;
  pillowGovernanceConfirmed?: boolean;
};

export class HookValidator {
  decide(input: HookWorkerInput): HookWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.pillowGovernanceConfirmed === false) return "fail";
    return "pass";
  }

  validateHookReports(
    reports: HookReport[] | null,
    input: HookWorkerInput,
    started: number,
  ): HookWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Hook Worker requires validated=true");
    }
    if (input.pillowGovernanceConfirmed === false) {
      errors.push("Hook Worker requires pillowGovernanceConfirmed=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No hook reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.hookReportId) errors.push("Missing hook report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.scriptId) errors.push("Missing script ID");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.topicId) errors.push("Missing topic ID");
        if (!report.contentFormat) errors.push("Missing content format");
        if (!report.primaryHook?.text) errors.push("Missing primary hook");
        if (!report.primaryHook?.hookType) errors.push("Missing primary hook type");
        if (!report.alternativeHooks.length) errors.push("Missing alternative hooks");
        if (!report.curiosityGaps.length) errors.push("Missing curiosity gaps");
        if (!report.retentionLoops.length) errors.push("Missing retention loops");
        if (!report.continuationMoments.length) errors.push("Missing continuation moments");
        if (!report.engagementRationale) errors.push("Missing engagement rationale");
        if (!report.selfReviewSummary) errors.push("Missing self-review summary");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.neverRewriteCompleteScript) {
          errors.push("Hook Worker must never rewrite complete script");
        }
        if (!report.neverGenerateThumbnails) {
          errors.push("Hook Worker must never generate thumbnails");
        }
        if (!report.neverGenerateVideos) {
          errors.push("Hook Worker must never generate videos");
        }
        if (!report.neverPublishContent) {
          errors.push("Hook Worker must never publish content");
        }
        if (!report.neverOverridePillow) {
          errors.push("Hook Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Hook Worker must never override Grand King");
        }
        if (!report.neverImplementQ407OrLater) {
          errors.push("Hook Worker must never implement Q4-07 or later");
        }
        if (!report.neverUseMisleadingOrDeceptiveHooks) {
          errors.push("Hook Worker must never use misleading or deceptive hooks");
        }
        if (!report.preserveApprovedScriptIntent) {
          errors.push("Hook Worker must preserve approved script intent");
        }
        if (!report.generateOriginalHooks) {
          errors.push("Hook Worker must generate original hooks");
        }
        if (report.alternativeHooks.length < 2) {
          warnings.push(`Hook report ${report.hookReportId} has fewer than 2 alternative hooks`);
        }
        if (!report.selfReviewPassed) {
          warnings.push(`Hook report ${report.hookReportId} self-review did not fully pass`);
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
    decision: HookWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): HookWorkerValidationReport {
    return {
      validationReportId: `hkw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: HKW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.rewriteCompleteScript === true ||
      input.generateThumbnails === true ||
      input.generateVideos === true ||
      input.publishContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ407OrLater === true ||
      input.useMisleadingHooks === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.rewriteCompleteScript) {
      errors.push("Hook Worker must never rewrite complete script");
    }
    if (input.generateThumbnails) {
      errors.push("Hook Worker must never generate thumbnails");
    }
    if (input.generateVideos) errors.push("Hook Worker must never generate videos");
    if (input.publishContent) errors.push("Hook Worker must never publish content");
    if (input.overridePillow) errors.push("Hook Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Hook Worker must never override Grand King");
    if (input.implementQ407OrLater) {
      errors.push("Hook Worker must never implement Q4-07 or later");
    }
    if (input.useMisleadingHooks) {
      errors.push("Hook Worker must never use misleading or deceptive hooks");
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
