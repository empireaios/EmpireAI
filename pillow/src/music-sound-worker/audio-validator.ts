import { MSW_METADATA_VERSION } from "./paths.js";
import type {
  MusicSoundReport,
  MusicSoundWorkerInput,
  MusicSoundWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  assembleVideos?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ414OrLater?: boolean;
  useUnapprovedCopyrightedAssets?: boolean;
  validated?: boolean;
};

export class AudioValidator {
  decide(input: MusicSoundWorkerInput): MusicSoundWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateAudioReports(
    reports: MusicSoundReport[] | null,
    input: MusicSoundWorkerInput,
    started: number,
  ): MusicSoundWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Music & Sound Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No music & sound reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.audioReportId) errors.push("Missing audio report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.videoId) errors.push("Missing video ID");
        if (!report.scriptId) errors.push("Missing script ID");
        if (!report.backgroundMusicAssets.length) errors.push("Missing background music assets");
        if (!report.soundEffectAssets.length) errors.push("Missing sound effect assets");
        if (!report.sceneTimeline.length) errors.push("Missing scene timeline");
        if (!report.audioPlacement.length) errors.push("Missing audio placement");
        if (!report.licensingStatus) errors.push("Missing licensing status");
        if (!report.qualityValidation) errors.push("Missing quality validation");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverAssembleVideos) {
          errors.push("Music & Sound Worker must never assemble videos");
        }
        if (!report.neverPublishMedia) {
          errors.push("Music & Sound Worker must never publish media");
        }
        if (!report.neverOverridePillow) {
          errors.push("Music & Sound Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Music & Sound Worker must never override Grand King");
        }
        if (!report.neverImplementQ414OrLater) {
          errors.push("Music & Sound Worker must never implement Q4-14 or later");
        }
        if (!report.neverUseUnapprovedCopyrightedAssets) {
          errors.push("Music & Sound Worker must never use unapproved copyrighted assets");
        }
        if (!report.preserveLicensingInformation) {
          errors.push("Music & Sound Worker must preserve licensing information");
        }
        if (!report.validateCopyrightCompliance) {
          errors.push("Music & Sound Worker must validate copyright compliance");
        }
        if (report.licensingStatus === "unapproved" || report.licensingStatus === "restricted") {
          errors.push(`Licensing status ${report.licensingStatus} is not permitted`);
        }
        if (report.backgroundMusicAssets.some((a) => a.licensingStatus === "unapproved")) {
          errors.push("Unapproved copyrighted music assets are forbidden");
        }
        if (report.qualityValidation.status === "fail") {
          warnings.push(`Audio report ${report.audioReportId} failed quality validation`);
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
    decision: MusicSoundWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MusicSoundWorkerValidationReport {
    return {
      validationReportId: `msw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MSW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.assembleVideos === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ414OrLater === true ||
      input.useUnapprovedCopyrightedAssets === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.assembleVideos) errors.push("Music & Sound Worker must never assemble videos");
    if (input.publishMedia) errors.push("Music & Sound Worker must never publish media");
    if (input.overridePillow) errors.push("Music & Sound Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Music & Sound Worker must never override Grand King");
    if (input.implementQ414OrLater) {
      errors.push("Music & Sound Worker must never implement Q4-14 or later");
    }
    if (input.useUnapprovedCopyrightedAssets) {
      errors.push("Music & Sound Worker must never use unapproved copyrighted assets");
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
