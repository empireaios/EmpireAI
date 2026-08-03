import { THW_METADATA_VERSION } from "./paths.js";
import type {
  ThumbnailReport,
  ThumbnailWorkerInput,
  ThumbnailWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  generateFinalArtwork?: boolean;
  editImagesDirectly?: boolean;
  publishThumbnails?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ408OrLater?: boolean;
  useMisleadingThumbnails?: boolean;
  validated?: boolean;
};

export class ThumbnailValidator {
  decide(input: ThumbnailWorkerInput): ThumbnailWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateThumbnailReports(
    reports: ThumbnailReport[] | null,
    input: ThumbnailWorkerInput,
    started: number,
  ): ThumbnailWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Thumbnail Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No thumbnail reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.thumbnailReportId) errors.push("Missing thumbnail report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.scriptId) errors.push("Missing script ID");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.topicId) errors.push("Missing topic ID");
        if (!report.contentFormat) errors.push("Missing content format");
        if (!report.thumbnailConcepts.length) errors.push("Missing thumbnail concepts");
        if (!report.primaryConcept?.conceptId) errors.push("Missing primary concept");
        if (!report.abVariants.length) errors.push("Missing A/B variants");
        if (!report.textOverlays.length) errors.push("Missing text overlays");
        if (!report.emotionalTriggers.length) errors.push("Missing emotional triggers");
        if (!report.compositionGuidance?.framing) errors.push("Missing composition guidance");
        if (!report.selfReviewSummary) errors.push("Missing self-review summary");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.neverGenerateFinalArtwork) {
          errors.push("Thumbnail Worker must never generate final artwork");
        }
        if (!report.neverEditImagesDirectly) {
          errors.push("Thumbnail Worker must never edit images directly");
        }
        if (!report.neverPublishThumbnails) {
          errors.push("Thumbnail Worker must never publish thumbnails");
        }
        if (!report.neverOverridePillow) {
          errors.push("Thumbnail Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Thumbnail Worker must never override Grand King");
        }
        if (!report.neverImplementQ408OrLater) {
          errors.push("Thumbnail Worker must never implement Q4-08 or later");
        }
        if (!report.neverUseMisleadingOrDeceptiveThumbnails) {
          errors.push("Thumbnail Worker must never use misleading or deceptive thumbnails");
        }
        if (!report.followEditorInChiefStrategy) {
          errors.push("Thumbnail Worker must follow editor-in-chief strategy");
        }
        if (!report.remainConsistentWithApprovedScript) {
          errors.push("Thumbnail Worker must remain consistent with approved script");
        }
        if (!report.produceMultipleDesignAlternatives) {
          errors.push("Thumbnail Worker must produce multiple design alternatives");
        }
        if (report.thumbnailConcepts.length < 2) {
          warnings.push(`Thumbnail report ${report.thumbnailReportId} has fewer than 2 concepts`);
        }
        if (!report.selfReviewPassed) {
          warnings.push(`Thumbnail report ${report.thumbnailReportId} self-review did not fully pass`);
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
    decision: ThumbnailWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ThumbnailWorkerValidationReport {
    return {
      validationReportId: `thw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: THW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.generateFinalArtwork === true ||
      input.editImagesDirectly === true ||
      input.publishThumbnails === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ408OrLater === true ||
      input.useMisleadingThumbnails === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.generateFinalArtwork) {
      errors.push("Thumbnail Worker must never generate final artwork");
    }
    if (input.editImagesDirectly) {
      errors.push("Thumbnail Worker must never edit images directly");
    }
    if (input.publishThumbnails) errors.push("Thumbnail Worker must never publish thumbnails");
    if (input.overridePillow) errors.push("Thumbnail Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Thumbnail Worker must never override Grand King");
    if (input.implementQ408OrLater) {
      errors.push("Thumbnail Worker must never implement Q4-08 or later");
    }
    if (input.useMisleadingThumbnails) {
      errors.push("Thumbnail Worker must never use misleading or deceptive thumbnails");
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
