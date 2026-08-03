import { VAW_METADATA_VERSION } from "./paths.js";
import type {
  VideoAssemblyReport,
  VideoAssemblyWorkerInput,
  VideoAssemblyWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  writeScripts?: boolean;
  generateVoiceovers?: boolean;
  generateThumbnails?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ412OrLater?: boolean;
  validated?: boolean;
};

export class AssemblyValidator {
  decide(input: VideoAssemblyWorkerInput): VideoAssemblyWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateAssemblyReports(
    reports: VideoAssemblyReport[] | null,
    input: VideoAssemblyWorkerInput,
    started: number,
  ): VideoAssemblyWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Video Assembly Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No video assembly reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.assemblyId) errors.push("Missing assembly ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.scriptId) errors.push("Missing script ID");
        if (!report.voiceAssetId) errors.push("Missing voice asset ID");
        if (!report.visualAssetIds.length) errors.push("Missing visual asset IDs");
        if (!report.creativeAssetIds.length) errors.push("Missing creative asset IDs");
        if (!report.sceneTimeline.length) errors.push("Missing scene timeline");
        if (!report.renderSettings) errors.push("Missing render settings");
        if (!report.outputFormats.length) errors.push("Missing output formats");
        if (!report.qualityValidation) errors.push("Missing quality validation");
        if (!report.finalVideoReference) errors.push("Missing final video reference");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverWriteScripts) {
          errors.push("Video Assembly Worker must never write scripts");
        }
        if (!report.neverGenerateVoiceovers) {
          errors.push("Video Assembly Worker must never generate voiceovers");
        }
        if (!report.neverGenerateThumbnails) {
          errors.push("Video Assembly Worker must never generate thumbnails");
        }
        if (!report.neverPublishMedia) {
          errors.push("Video Assembly Worker must never publish media");
        }
        if (!report.neverOverridePillow) {
          errors.push("Video Assembly Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Video Assembly Worker must never override Grand King");
        }
        if (!report.neverImplementQ412OrLater) {
          errors.push("Video Assembly Worker must never implement Q4-12 or later");
        }
        if (!report.preserveCompleteAssetTraceability) {
          errors.push("Video Assembly Worker must preserve complete asset traceability");
        }
        if (!report.preserveSynchronizationBetweenMediaAssets) {
          errors.push("Video Assembly Worker must preserve synchronization between media assets");
        }
        if (report.outputFormats.length < 2) {
          warnings.push(`Assembly ${report.assemblyId} has fewer than 2 output formats`);
        }
        if (report.qualityValidation.status === "fail") {
          warnings.push(`Assembly ${report.assemblyId} failed quality validation`);
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
    decision: VideoAssemblyWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): VideoAssemblyWorkerValidationReport {
    return {
      validationReportId: `vaw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: VAW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.writeScripts === true ||
      input.generateVoiceovers === true ||
      input.generateThumbnails === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ412OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.writeScripts) errors.push("Video Assembly Worker must never write scripts");
    if (input.generateVoiceovers) {
      errors.push("Video Assembly Worker must never generate voiceovers");
    }
    if (input.generateThumbnails) {
      errors.push("Video Assembly Worker must never generate thumbnails");
    }
    if (input.publishMedia) errors.push("Video Assembly Worker must never publish media");
    if (input.overridePillow) errors.push("Video Assembly Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Video Assembly Worker must never override Grand King");
    }
    if (input.implementQ412OrLater) {
      errors.push("Video Assembly Worker must never implement Q4-12 or later");
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
