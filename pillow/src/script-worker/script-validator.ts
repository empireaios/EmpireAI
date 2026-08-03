import { SCW_METADATA_VERSION } from "./paths.js";
import type {
  ScriptReport,
  ScriptWorkerInput,
  ScriptWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  generateVisuals?: boolean;
  generateVoiceovers?: boolean;
  assembleVideos?: boolean;
  publishContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ406OrLater?: boolean;
  validated?: boolean;
  pillowGovernanceConfirmed?: boolean;
};

export class ScriptValidator {
  decide(input: ScriptWorkerInput): ScriptWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.pillowGovernanceConfirmed === false) return "fail";
    return "pass";
  }

  validateScripts(
    scripts: ScriptReport[] | null,
    input: ScriptWorkerInput,
    started: number,
  ): ScriptWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Script Worker requires validated=true");
    }
    if (input.pillowGovernanceConfirmed === false) {
      errors.push("Script Worker requires pillowGovernanceConfirmed=true");
    }
    if (!scripts || scripts.length === 0) {
      if (decision !== "fail") {
        warnings.push("No scripts were produced yet");
      }
    } else {
      for (const script of scripts) {
        if (!script.scriptId) errors.push("Missing script ID");
        if (!script.timestamp) errors.push("Missing timestamp");
        if (!script.channelId) errors.push("Missing channel ID");
        if (!script.topicId) errors.push("Missing topic ID");
        if (!script.contentFormat) errors.push("Missing content format");
        if (!script.targetAudience) errors.push("Missing target audience");
        if (!script.scriptTitle) errors.push("Missing script title");
        if (!script.scriptSections.length) errors.push("Missing script sections");
        if (script.estimatedDuration == null) errors.push("Missing estimated duration");
        if (!script.editorialCompliance) errors.push("Missing editorial compliance");
        if (!script.selfReviewSummary) errors.push("Missing self-review summary");
        if (script.confidenceScore == null) errors.push("Missing confidence score");
        if (!script.metadataVersion) errors.push("Missing metadata version");
        if (!script.neverGenerateVisuals) errors.push("Script Worker must never generate visuals");
        if (!script.neverGenerateVoiceovers) {
          errors.push("Script Worker must never generate voiceovers");
        }
        if (!script.neverAssembleVideos) {
          errors.push("Script Worker must never assemble videos");
        }
        if (!script.neverPublishContent) {
          errors.push("Script Worker must never publish content");
        }
        if (!script.neverOverridePillow) {
          errors.push("Script Worker must never override Pillow");
        }
        if (!script.neverOverrideGrandKing) {
          errors.push("Script Worker must never override Grand King");
        }
        if (!script.neverImplementQ406OrLater) {
          errors.push("Script Worker must never implement Q4-06 or later");
        }
        if (!script.followApprovedTopicPlan) {
          errors.push("Script Worker must follow approved topic plan");
        }
        if (!script.followEditorInChiefStrategy) {
          errors.push("Script Worker must follow Editor-in-Chief strategy");
        }
        if (!script.narrationReadyText?.trim()) {
          errors.push("Missing narration-ready text");
        }
        const hasIntro = script.scriptSections.some((s) => s.sectionType === "intro" || s.sectionType === "hook");
        const hasBody = script.scriptSections.some((s) => s.sectionType === "body" || s.sectionType === "list_item");
        const hasConclusion = script.scriptSections.some(
          (s) => s.sectionType === "conclusion" || s.sectionType === "cta",
        );
        if (!hasIntro) warnings.push(`Script ${script.scriptId} missing intro/hook section`);
        if (!hasBody) warnings.push(`Script ${script.scriptId} missing body section`);
        if (!hasConclusion) warnings.push(`Script ${script.scriptId} missing conclusion/cta section`);
        if (!script.selfReviewPassed) {
          warnings.push(`Script ${script.scriptId} self-review did not fully pass`);
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
    decision: ScriptWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ScriptWorkerValidationReport {
    return {
      validationReportId: `scw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SCW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.generateVisuals === true ||
      input.generateVoiceovers === true ||
      input.assembleVideos === true ||
      input.publishContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ406OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.generateVisuals) errors.push("Script Worker must never generate visuals");
    if (input.generateVoiceovers) errors.push("Script Worker must never generate voiceovers");
    if (input.assembleVideos) errors.push("Script Worker must never assemble videos");
    if (input.publishContent) errors.push("Script Worker must never publish content");
    if (input.overridePillow) errors.push("Script Worker must never override Pillow");
    if (input.overrideGrandKing) errors.push("Script Worker must never override Grand King");
    if (input.implementQ406OrLater) {
      errors.push("Script Worker must never implement Q4-06 or later");
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
