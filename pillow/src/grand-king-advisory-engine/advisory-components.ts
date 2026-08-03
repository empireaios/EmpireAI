import { GKA_METADATA_VERSION } from "./paths.js";
import type { BusinessImpact, GrandKingAdvisoryInput, PriorityLevel } from "./types.js";

export class StrategicAnalysisEngine {
  resolveCategory(action: string, input: GrandKingAdvisoryInput): string {
    return input.strategicCategory?.trim() || action.replaceAll("_", " ");
  }
}

export class DecisionPrioritizationEngine {
  score(input: GrandKingAdvisoryInput): number {
    return Math.max(0, Math.min(100, input.priorityScore ?? (input.riskHint || input.opportunityHint ? 75 : 50)));
  }
  priorityLevel(score: number, input: GrandKingAdvisoryInput): PriorityLevel {
    if (input.priorityLevel) return input.priorityLevel;
    if (score >= 85) return "critical";
    if (score >= 70) return "high";
    if (score >= 45) return "moderate";
    return "low";
  }
}

export class OpportunityAdvisoryEngine {
  evidence(input: GrandKingAdvisoryInput, category: string): string {
    return input.supportingEvidence?.trim() || `Structural evidence for ${category}`;
  }
}

export class RiskAdvisoryEngine {
  impact(input: GrandKingAdvisoryInput, score: number): BusinessImpact {
    if (input.businessImpact) return input.businessImpact;
    if (input.riskHint === true || score >= 85) return "transformational";
    if (score >= 70) return "significant";
    if (score >= 45) return "material";
    return "limited";
  }
}

export class ExecutiveRecommendationEngine {
  summarize(input: GrandKingAdvisoryInput, scope: string, category: string): string {
    return input.recommendationSummary?.trim() || `Advise Grand King on ${category} across ${scope}`;
  }
}

export class AdvisoryMetadataGenerator {
  version() {
    return GKA_METADATA_VERSION;
  }
  traceId(index: number) {
    return `gka-trace-${Date.now()}-${index}`;
  }
}

export class AdvisoryValidator {
  decide(input: GrandKingAdvisoryInput): "pass" | "partial" | "fail" {
    if (input.executeDecisionAutomatically === true && input.governanceApproved !== true) return "fail";
    if (input.validated === true) return "pass";
    return "partial";
  }
}

export class HealthMonitor {
  health(enabled: boolean) {
    return enabled ? ("healthy" as const) : ("failed" as const);
  }
}

export class RecoveryManager {
  readonly automaticRecoveryEnabled = true as const;
  private attempts = 0;
  attempt() {
    this.attempts += 1;
    return { recovered: true as const, attempt: this.attempts };
  }
  getAttempts() {
    return this.attempts;
  }
}
