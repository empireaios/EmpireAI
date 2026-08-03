import { VRW_METADATA_VERSION } from "./paths.js";
import type {
  VisualResearchReport,
  VisualResearchWorkerInput,
  VisualResearchWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  generateFinalCreativeAssets?: boolean;
  editImages?: boolean;
  assembleVideos?: boolean;
  publishContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ409OrLater?: boolean;
  useUnapprovedVisualSource?: boolean;
  validated?: boolean;
};

export class VisualValidator {
  decide(input: VisualResearchWorkerInput): VisualResearchWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateVisualResearchReports(
    reports: VisualResearchReport[] | null,
    input: VisualResearchWorkerInput,
    started: number,
  ): VisualResearchWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Visual Research Worker requires validated=true");
    }
    if (input.useUnapprovedVisualSource === true) {
      errors.push("Visual Research Worker must use only approved visual sources");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No visual research reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.visualResearchId) errors.push("Missing visual research ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.scriptId) errors.push("Missing script ID");
        if (report.sceneNumber == null) errors.push("Missing scene number");
        if (!report.requiredVisual) errors.push("Missing required visual");
        if (!report.visualSource) errors.push("Missing visual source");
        if (!report.assetType) errors.push("Missing asset type");
        if (!report.copyrightStatus) errors.push("Missing copyright status");
        if (!report.usageRights) errors.push("Missing usage rights");
        if (!report.timelinePosition) errors.push("Missing timeline position");
        if (!report.coverageStatus) errors.push("Missing coverage status");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.topicId) errors.push("Missing topic ID");
        if (!report.contentFormat) errors.push("Missing content format");
        if (!report.scenes.length) errors.push("Missing scene records");
        if (!report.neverGenerateFinalCreativeAssets) {
          errors.push("Visual Research Worker must never generate final creative assets");
        }
        if (!report.neverEditImages) {
          errors.push("Visual Research Worker must never edit images");
        }
        if (!report.neverAssembleVideos) {
          errors.push("Visual Research Worker must never assemble videos");
        }
        if (!report.neverPublishContent) {
          errors.push("Visual Research Worker must never publish content");
        }
        if (!report.neverOverridePillow) {
          errors.push("Visual Research Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Visual Research Worker must never override Grand King");
        }
        if (!report.neverImplementQ409OrLater) {
          errors.push("Visual Research Worker must never implement Q4-09 or later");
        }
        if (!report.useOnlyApprovedVisualSources) {
          errors.push("Visual Research Worker must use only approved visual sources");
        }
        if (!report.preserveCompleteAssetTraceability) {
          errors.push("Visual Research Worker must preserve complete asset traceability");
        }
        if (!report.preserveCopyrightInformation) {
          errors.push("Visual Research Worker must preserve copyright information");
        }
        if (!report.preserveAuditHistory) {
          errors.push("Visual Research Worker must preserve audit history");
        }
        const missingCoverage = report.scenes.filter((s) => s.coverageStatus === "missing");
        if (missingCoverage.length && !report.missingAssets.length) {
          warnings.push(`Report ${report.visualResearchId} has missing coverage but no missingAssets list`);
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
    decision: VisualResearchWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): VisualResearchWorkerValidationReport {
    return {
      validationReportId: `vrw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: VRW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.generateFinalCreativeAssets === true ||
      input.editImages === true ||
      input.assembleVideos === true ||
      input.publishContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ409OrLater === true ||
      input.useUnapprovedVisualSource === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.generateFinalCreativeAssets) {
      errors.push("Visual Research Worker must never generate final creative assets");
    }
    if (input.editImages) errors.push("Visual Research Worker must never edit images");
    if (input.assembleVideos) errors.push("Visual Research Worker must never assemble videos");
    if (input.publishContent) errors.push("Visual Research Worker must never publish content");
    if (input.overridePillow) errors.push("Visual Research Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Visual Research Worker must never override Grand King");
    if (input.implementQ409OrLater) {
      errors.push("Visual Research Worker must never implement Q4-09 or later");
    }
    if (input.useUnapprovedVisualSource) {
      errors.push("Visual Research Worker must use only approved visual sources");
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
