import { VOW_METADATA_VERSION } from "./paths.js";
import type {
  VoiceReport,
  VoiceWorkerInput,
  VoiceWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  rewriteScripts?: boolean;
  assembleVideos?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ411OrLater?: boolean;
  validated?: boolean;
};

export class VoiceValidator {
  decide(input: VoiceWorkerInput): VoiceWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateVoiceReports(
    reports: VoiceReport[] | null,
    input: VoiceWorkerInput,
    started: number,
  ): VoiceWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Voice Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No voice reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.voiceReportId) errors.push("Missing voice report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.scriptId) errors.push("Missing script ID");
        if (!report.voiceProfile) errors.push("Missing voice profile");
        if (!report.language) errors.push("Missing language");
        if (!report.narrationSegments.length) errors.push("Missing narration segments");
        if (!report.voiceGenerationSettings) errors.push("Missing voice generation settings");
        if (!report.voiceAssetReferences.length) errors.push("Missing voice asset references");
        if (!report.qualityStatus) errors.push("Missing quality status");
        if (report.variantCount == null) errors.push("Missing variant count");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverRewriteScripts) {
          errors.push("Voice Worker must never rewrite scripts");
        }
        if (!report.neverAssembleVideos) {
          errors.push("Voice Worker must never assemble videos");
        }
        if (!report.neverPublishMedia) {
          errors.push("Voice Worker must never publish media");
        }
        if (!report.neverOverridePillow) {
          errors.push("Voice Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Voice Worker must never override Grand King");
        }
        if (!report.neverImplementQ411OrLater) {
          errors.push("Voice Worker must never implement Q4-11 or later");
        }
        if (!report.preserveScriptTraceability) {
          errors.push("Voice Worker must preserve script traceability");
        }
        if (!report.preserveGeneratedVoiceAssetReferences) {
          errors.push("Voice Worker must preserve generated voice asset references");
        }
        if (!report.preserveVoiceConfigurationHistory) {
          errors.push("Voice Worker must preserve voice configuration history");
        }
        if (report.voiceAssetReferences.length < 1) {
          warnings.push(`Voice report ${report.voiceReportId} has no voice assets`);
        }
        if (report.variantCount < 2) {
          warnings.push(`Voice report ${report.voiceReportId} has fewer than 2 variants`);
        }
        if (report.qualityStatus === "fail") {
          warnings.push(`Voice report ${report.voiceReportId} failed quality check`);
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
    decision: VoiceWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): VoiceWorkerValidationReport {
    return {
      validationReportId: `vow-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: VOW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.rewriteScripts === true ||
      input.assembleVideos === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ411OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.rewriteScripts) errors.push("Voice Worker must never rewrite scripts");
    if (input.assembleVideos) errors.push("Voice Worker must never assemble videos");
    if (input.publishMedia) errors.push("Voice Worker must never publish media");
    if (input.overridePillow) errors.push("Voice Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Voice Worker must never override Grand King");
    if (input.implementQ411OrLater) {
      errors.push("Voice Worker must never implement Q4-11 or later");
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
