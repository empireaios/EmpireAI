import { TPW_METADATA_VERSION } from "./paths.js";
import type {
  TopicPlan,
  TopicPlannerWorkerInput,
  TopicPlannerWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  writeScripts?: boolean;
  generateVisuals?: boolean;
  produceVideos?: boolean;
  publishContent?: boolean;
  bypassPillowGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ405OrLater?: boolean;
  requireGrandKingDailyPrompt?: boolean;
  validated?: boolean;
  pillowGovernanceConfirmed?: boolean;
};

export class PlanValidator {
  decide(input: TopicPlannerWorkerInput): TopicPlannerWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.pillowGovernanceConfirmed === false) return "fail";
    return "pass";
  }

  validatePlans(
    plans: TopicPlan[] | null,
    input: TopicPlannerWorkerInput,
    started: number,
  ): TopicPlannerWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Topic Planner Worker requires validated=true");
    }
    if (input.pillowGovernanceConfirmed === false) {
      errors.push("Topic Planner Worker requires pillowGovernanceConfirmed=true");
    }
    if (!plans || plans.length === 0) {
      if (decision !== "fail") {
        warnings.push("No topic plans were produced yet");
      }
    } else {
      for (const plan of plans) {
        if (!plan.topicPlanId) errors.push("Missing topic plan ID");
        if (!plan.timestamp) errors.push("Missing timestamp");
        if (!plan.channelId) errors.push("Missing channel ID");
        if (!plan.publishingDate) errors.push("Missing publishing date");
        if (!plan.selectedTopics.length) errors.push("Missing selected topics");
        if (!plan.topicPriority) errors.push("Missing topic priority");
        if (!plan.selectionReason) errors.push("Missing selection reason");
        if (!plan.editorialAlignment) errors.push("Missing editorial alignment");
        if (!plan.trendAlignment) errors.push("Missing trend alignment");
        if (!plan.expectedAudience) errors.push("Missing expected audience");
        if (plan.confidenceScore == null) errors.push("Missing confidence score");
        if (!plan.metadataVersion) errors.push("Missing metadata version");
        if (!plan.neverWriteScripts) errors.push("Topic Planner Worker must never write scripts");
        if (!plan.neverGenerateVisuals) {
          errors.push("Topic Planner Worker must never generate visuals");
        }
        if (!plan.neverProduceVideos) {
          errors.push("Topic Planner Worker must never produce videos");
        }
        if (!plan.neverPublishContent) {
          errors.push("Topic Planner Worker must never publish content");
        }
        if (!plan.neverBypassPillowGovernance) {
          errors.push("Topic Planner Worker must never bypass Pillow governance");
        }
        if (!plan.neverOverridePillow) {
          errors.push("Topic Planner Worker must never override Pillow");
        }
        if (!plan.neverOverrideGrandKing) {
          errors.push("Topic Planner Worker must never override Grand King");
        }
        if (!plan.neverImplementQ405OrLater) {
          errors.push("Topic Planner Worker must never implement Q4-05 or later");
        }
        if (!plan.neverRequireGrandKingDailyPrompts) {
          errors.push("Topic Planner Worker must never require Grand King daily prompts");
        }
        if (!plan.followEditorInChiefStrategy) {
          errors.push("Topic Planner Worker must follow Editor-in-Chief strategy");
        }
        if (!plan.useTrendResearchEvidence) {
          errors.push("Topic Planner Worker must use trend research evidence");
        }
        if (plan.cadenceStatus === "behind") {
          warnings.push(`Plan ${plan.topicPlanId} cadence is behind schedule`);
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
    decision: TopicPlannerWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): TopicPlannerWorkerValidationReport {
    return {
      validationReportId: `tpw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TPW_METADATA_VERSION,
    };
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.writeScripts === true ||
      input.generateVisuals === true ||
      input.produceVideos === true ||
      input.publishContent === true ||
      input.bypassPillowGovernance === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ405OrLater === true ||
      input.requireGrandKingDailyPrompt === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.writeScripts) errors.push("Topic Planner Worker must never write scripts");
    if (input.generateVisuals) errors.push("Topic Planner Worker must never generate visuals");
    if (input.produceVideos) errors.push("Topic Planner Worker must never produce videos");
    if (input.publishContent) errors.push("Topic Planner Worker must never publish content");
    if (input.bypassPillowGovernance) {
      errors.push("Topic Planner Worker must never bypass Pillow governance");
    }
    if (input.overridePillow) errors.push("Topic Planner Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Topic Planner Worker must never override Grand King");
    }
    if (input.implementQ405OrLater) {
      errors.push("Topic Planner Worker must never implement Q4-05 or later");
    }
    if (input.requireGrandKingDailyPrompt) {
      errors.push("Topic Planner Worker must never require Grand King daily prompts");
    }
  }
}

export class HealthMonitor {
  status(decision: "pass" | "fail", enabled: boolean): "healthy" | "degraded" | "failed" | "standby" {
    if (!enabled) return "standby";
    if (decision === "fail") return "failed";
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

  getFailures() {
    return this.failures;
  }
}
