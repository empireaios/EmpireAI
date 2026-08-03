import { ICW_METADATA_VERSION } from "./paths.js";
import type {
  CreativeAssetReport,
  ImageCreativeWorkerInput,
  ImageCreativeWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  assembleVideos?: boolean;
  generateVoiceovers?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ410OrLater?: boolean;
  validated?: boolean;
};

export class CreativeValidator {
  decide(input: ImageCreativeWorkerInput): ImageCreativeWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateCreativeAssetReports(
    reports: CreativeAssetReport[] | null,
    input: ImageCreativeWorkerInput,
    started: number,
  ): ImageCreativeWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Image & Creative Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No creative asset reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.creativeAssetId) errors.push("Missing creative asset ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.scriptId) errors.push("Missing script ID");
        if (!report.sceneId) errors.push("Missing scene ID");
        if (!report.assetType) errors.push("Missing asset type");
        if (!report.sourceAssets.length) errors.push("Missing source assets");
        if (!report.generatedAssets.length) errors.push("Missing generated assets");
        if (!report.qualityStatus) errors.push("Missing quality status");
        if (!report.copyrightStatus) errors.push("Missing copyright status");
        if (report.variantCount == null) errors.push("Missing variant count");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.complianceNotes) errors.push("Missing compliance notes");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverAssembleVideos) {
          errors.push("Image & Creative Worker must never assemble videos");
        }
        if (!report.neverGenerateVoiceovers) {
          errors.push("Image & Creative Worker must never generate voiceovers");
        }
        if (!report.neverPublishMedia) {
          errors.push("Image & Creative Worker must never publish media");
        }
        if (!report.neverOverridePillow) {
          errors.push("Image & Creative Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Image & Creative Worker must never override Grand King");
        }
        if (!report.neverImplementQ410OrLater) {
          errors.push("Image & Creative Worker must never implement Q4-10 or later");
        }
        if (!report.preserveCompleteAssetTraceability) {
          errors.push("Image & Creative Worker must preserve complete asset traceability");
        }
        if (!report.respectCopyrightAndLicensing) {
          errors.push("Image & Creative Worker must respect copyright and licensing");
        }
        if (!report.recordAllEditsPerformed) {
          errors.push("Image & Creative Worker must record all edits performed");
        }
        if (report.generatedAssets.length < 1) {
          warnings.push(`Creative asset report ${report.creativeAssetId} has no generated assets`);
        }
        if (report.variantCount < 2) {
          warnings.push(`Creative asset report ${report.creativeAssetId} has fewer than 2 variants`);
        }
        if (report.qualityStatus === "fail") {
          warnings.push(`Creative asset report ${report.creativeAssetId} failed quality check`);
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
    decision: ImageCreativeWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ImageCreativeWorkerValidationReport {
    return {
      validationReportId: `icw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ICW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.assembleVideos === true ||
      input.generateVoiceovers === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ410OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.assembleVideos) {
      errors.push("Image & Creative Worker must never assemble videos");
    }
    if (input.generateVoiceovers) {
      errors.push("Image & Creative Worker must never generate voiceovers");
    }
    if (input.publishMedia) errors.push("Image & Creative Worker must never publish media");
    if (input.overridePillow) errors.push("Image & Creative Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Image & Creative Worker must never override Grand King");
    if (input.implementQ410OrLater) {
      errors.push("Image & Creative Worker must never implement Q4-10 or later");
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
