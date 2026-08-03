import { IGE_METADATA_VERSION } from "./paths.js";
import type { InfiniteGrowthInput } from "./types.js";

export class LongTermGrowthEngine {
  resolveCategory(action: string, input: InfiniteGrowthInput): string {
    return input.growthCategory?.trim() || action.replaceAll("_", " ");
  }
}

export class SustainabilityAnalysisEngine {
  sustainabilityScore(input: InfiniteGrowthInput): number {
    return Math.max(0, Math.min(100, input.sustainabilityScore ?? (input.constraintHint === true ? 45 : 75)));
  }
  governanceScore(input: InfiniteGrowthInput): number {
    if (typeof input.governanceScore === "number") return Math.max(0, Math.min(100, input.governanceScore));
    return input.governanceRiskHint === true ? 40 : 85;
  }
  operationalScore(input: InfiniteGrowthInput): number {
    if (typeof input.operationalScore === "number") return Math.max(0, Math.min(100, input.operationalScore));
    return input.operationalRiskHint === true ? 40 : 85;
  }
}

export class GrowthConstraintEngine {
  detectConstraint(input: InfiniteGrowthInput, sustainability: number, governance: number, operational: number): boolean {
    return input.constraintHint === true || sustainability < 55 || governance < 55 || operational < 55;
  }
}

export class GrowthOpportunityEngine {
  priority(input: InfiniteGrowthInput, sustainability: number, governance: number, operational: number): number {
    if (typeof input.growthPriority === "number") return Math.max(0, Math.min(100, input.growthPriority));
    return Math.max(0, Math.min(100, Math.round((sustainability + governance + operational) / 3)));
  }
}

export class GrowthRecommendationEngine {
  summarize(input: InfiniteGrowthInput, scope: string, category: string): string {
    return input.recommendationSummary?.trim() || `Review sustainable long-term growth for ${scope} (${category})`;
  }
}

export class GrowthMetadataGenerator {
  version() {
    return IGE_METADATA_VERSION;
  }
  traceId(index: number) {
    return `ige-trace-${Date.now()}-${index}`;
  }
}

export class GrowthValidator {
  decide(input: InfiniteGrowthInput): "pass" | "partial" | "fail" {
    if (input.sacrificeGovernanceForGrowth === true) return "fail";
    if (input.reduceOperationalQualityForGrowth === true) return "fail";
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
