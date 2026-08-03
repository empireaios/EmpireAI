import { CRW_METADATA_VERSION, RECOMMENDATION_DECISIONS } from "./paths.js";
import type {
  ChannelRecommendationReport,
  ChannelRecommendationWorkerInput,
  ChannelRecommendationWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  createChannels?: boolean;
  configurePlatformAccounts?: boolean;
  publishContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ418OrLater?: boolean;
  createChannelsAutomatically?: boolean;
  validated?: boolean;
};

export class RecommendationValidator {
  decide(input: ChannelRecommendationWorkerInput): ChannelRecommendationWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecommendationReports(
    reports: ChannelRecommendationReport[] | null,
    input: ChannelRecommendationWorkerInput,
    started: number,
  ): ChannelRecommendationWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Channel Recommendation Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No channel recommendation reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.recommendationId) errors.push("Missing recommendation ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.proposedChannel?.channelName) errors.push("Missing proposed channel");
        if (!report.targetAudience?.primaryAudience) errors.push("Missing target audience");
        if (!report.audiencePotential) errors.push("Missing audience potential");
        if (!report.revenuePotential) errors.push("Missing revenue potential");
        if (!report.productionFeasibility) errors.push("Missing production feasibility");
        if (!report.competitionAssessment) errors.push("Missing competition assessment");
        if (!report.strategicFit) errors.push("Missing strategic fit");
        if (!report.contentSustainability) errors.push("Missing content sustainability");
        if (!report.riskAssessment) errors.push("Missing risk assessment");
        if (report.overallScore == null || Number.isNaN(report.overallScore)) {
          errors.push("Missing overall score");
        }
        if (
          !report.recommendation ||
          !(RECOMMENDATION_DECISIONS as readonly string[]).includes(report.recommendation)
        ) {
          errors.push("Recommendation must be Proceed, Monitor, or Reject");
        }
        if (!report.recommendationRationale?.trim()) {
          errors.push("Missing recommendation rationale");
        }
        if (report.overallScore != null && !report.recommendationRationale?.trim()) {
          errors.push("Overall score without recommendation rationale");
        }
        // Empty-array trap: supportingEvidence
        if (!report.supportingEvidence || report.supportingEvidence.length < 1) {
          errors.push("Missing supporting evidence");
        }
        if (report.confidenceScore == null || Number.isNaN(report.confidenceScore)) {
          errors.push("Missing confidence score");
        } else if (report.confidenceScore < 40) {
          warnings.push(
            `Recommendation report ${report.recommendationId} confidenceScore ${report.confidenceScore} is below 40`,
          );
        }
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.workerId) errors.push("Missing worker ID");
        if (!report.reportVersion) errors.push("Missing report version");
        if (!report.neverCreateChannelsAutomatically) {
          errors.push("Channel Recommendation Worker must never create channels automatically");
        }
        if (!report.neverCreateChannels) {
          errors.push("Channel Recommendation Worker must never create channels");
        }
        if (!report.neverConfigurePlatformAccounts) {
          errors.push("Channel Recommendation Worker must never configure platform accounts");
        }
        if (!report.neverPublishContent) {
          errors.push("Channel Recommendation Worker must never publish content");
        }
        if (!report.neverOverridePillow) {
          errors.push("Channel Recommendation Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Channel Recommendation Worker must never override Grand King");
        }
        if (!report.neverImplementQ418OrLater) {
          errors.push("Channel Recommendation Worker must never implement Q4-18 or later");
        }
        if (!report.baseRecommendationsOnEvidence) {
          errors.push("Channel Recommendation Worker must base recommendations on evidence");
        }
        if (!report.preserveCompleteSourceTraceability) {
          errors.push("Channel Recommendation Worker must preserve complete source traceability");
        }
        if (!report.distinguishFactsFromAssumptions) {
          errors.push("Channel Recommendation Worker must distinguish facts from assumptions");
        }
        if (!report.explainEveryRecommendation) {
          errors.push("Channel Recommendation Worker must explain every recommendation");
        }
        if (!report.preserveAuditHistory) {
          errors.push("Channel Recommendation Worker must preserve audit history");
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
    decision: ChannelRecommendationWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ChannelRecommendationWorkerValidationReport {
    return {
      validationReportId: `crw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.createChannels === true ||
      input.configurePlatformAccounts === true ||
      input.publishContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ418OrLater === true ||
      input.createChannelsAutomatically === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.createChannels) {
      errors.push("Channel Recommendation Worker must never create channels");
    }
    if (input.configurePlatformAccounts) {
      errors.push("Channel Recommendation Worker must never configure platform accounts");
    }
    if (input.publishContent) {
      errors.push("Channel Recommendation Worker must never publish content");
    }
    if (input.overridePillow) {
      errors.push("Channel Recommendation Worker must never override Pillow");
    }
    if (input.overrideGrandKing) {
      errors.push("Channel Recommendation Worker must never override Grand King");
    }
    if (input.implementQ418OrLater) {
      errors.push("Channel Recommendation Worker must never implement Q4-18 or later");
    }
    if (input.createChannelsAutomatically) {
      errors.push("Channel Recommendation Worker must never create channels automatically");
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
