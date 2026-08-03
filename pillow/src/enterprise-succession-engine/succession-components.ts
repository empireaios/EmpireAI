import { ESE_METADATA_VERSION } from "./paths.js";
import type { ContinuityStatus, EnterpriseSuccessionInput, RiskLevel } from "./types.js";

export class ContinuityPlanningEngine {
  resolveCategory(action: string, input: EnterpriseSuccessionInput): string {
    return input.successionCategory?.trim() || action.replaceAll("_", " ");
  }
}

export class ExecutiveSuccessionEngine {
  continuityStatus(input: EnterpriseSuccessionInput, readinessScore: number, threshold: number): ContinuityStatus {
    if (input.gapHint === true) return "gap_detected";
    if (input.successionRiskHint === true) return "at_risk";
    if (readinessScore >= threshold) return "ready";
    if (readinessScore >= Math.max(0, threshold - 25)) return "partial";
    return "at_risk";
  }
}

export class OrganizationalContinuityEngine {
  readinessScore(input: EnterpriseSuccessionInput): number {
    return Math.max(0, Math.min(100, input.readinessScore ?? (input.validated === true ? 80 : 55)));
  }
}

export class SuccessionReadinessEngine {
  riskLevel(input: EnterpriseSuccessionInput, continuityStatus: ContinuityStatus): RiskLevel {
    if (input.riskHint) return input.riskHint;
    if (continuityStatus === "gap_detected" || continuityStatus === "at_risk") return "elevated";
    if (continuityStatus === "partial") return "moderate";
    return "low";
  }
}

export class SuccessionRecommendationEngine {
  summarize(input: EnterpriseSuccessionInput, unit: string, category: string): string {
    return input.recommendationSummary?.trim() || `Review succession continuity for ${unit} (${category})`;
  }
}

export class SuccessionMetadataGenerator {
  version() {
    return ESE_METADATA_VERSION;
  }
  traceId(index: number) {
    return `ese-trace-${Date.now()}-${index}`;
  }
}

export class SuccessionValidator {
  decide(input: EnterpriseSuccessionInput): "pass" | "partial" | "fail" {
    if (input.modifyGovernanceApprovedPlan === true) return "fail";
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
