import { AIE_METADATA_VERSION } from "./paths.js";
import type { AutonomousInvestmentInput, ExecutionStatus } from "./types.js";

export class InvestmentOpportunityEngine {
  resolveCategory(action: string, input: AutonomousInvestmentInput): string {
    return input.investmentCategory?.trim() || action.replaceAll("_", " ");
  }
}

export class InvestmentEvaluationEngine {
  expectedReturn(input: AutonomousInvestmentInput): number {
    return Math.max(0, Math.min(100, input.expectedReturn ?? 12));
  }
}

export class InvestmentRiskEngine {
  riskScore(input: AutonomousInvestmentInput, threshold: number): number {
    const score = Math.max(0, Math.min(100, input.riskScore ?? 40));
    return input.underperformingHint === true ? Math.max(score, threshold) : score;
  }
}

export class InvestmentStrategyEngine {
  priority(input: AutonomousInvestmentInput, expectedReturn: number, riskScore: number): number {
    if (typeof input.investmentPriority === "number") return Math.max(0, Math.min(100, input.investmentPriority));
    return Math.max(0, Math.min(100, Math.round(expectedReturn * 0.7 + (100 - riskScore) * 0.3)));
  }

  executionStatus(action: string, input: AutonomousInvestmentInput, riskScore: number, riskThreshold: number): ExecutionStatus {
    if (action.includes("underperform")) return "underperforming";
    if (action.includes("execute")) {
      if (input.governanceApproved === true && riskScore < riskThreshold) return "executed";
      if (input.governanceApproved === true) return "approved";
      return "blocked";
    }
    if (input.governanceApproved === true) return "approved";
    if (action.includes("recommend") || action.includes("priorit")) return "recommended";
    return "pending_governance";
  }
}

export class InvestmentRecommendationEngine {
  summarize(input: AutonomousInvestmentInput, target: string, category: string): string {
    return input.recommendationSummary?.trim() || `Review investment strategy for ${target} (${category})`;
  }
}

export class InvestmentMetadataGenerator {
  version() {
    return AIE_METADATA_VERSION;
  }
  traceId(index: number) {
    return `aie-trace-${Date.now()}-${index}`;
  }
}

export class InvestmentValidator {
  decide(input: AutonomousInvestmentInput, executionBlocked: boolean): "pass" | "partial" | "fail" {
    if (executionBlocked && input.governanceApproved !== true) return "fail";
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
