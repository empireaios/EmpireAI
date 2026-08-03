import { CEG_METADATA_VERSION } from "./paths.js";
import type { CrossEmpireGovernanceInput, RiskLevel } from "./types.js";

export class ConstitutionalRulesEngine {
  resolveRuleReference(input: CrossEmpireGovernanceInput): string {
    return input.constitutionalRuleReference?.trim() || "CONST-EMPIRE-001";
  }
}

export class GovernancePolicyEngine {
  resolveCategory(action: string, input: CrossEmpireGovernanceInput): string {
    return input.governanceCategory?.trim() || action.replaceAll("_", " ");
  }
}

export class GovernanceComplianceEngine {
  evaluate(input: CrossEmpireGovernanceInput, threshold: number): { complianceStatus: "compliant" | "partial" | "non_compliant" | "unknown"; score: number } {
    const score = Math.max(0, Math.min(100, input.complianceScore ?? (input.validated === true ? 85 : 60)));
    if (input.violationHint === true) return { complianceStatus: "non_compliant", score: Math.min(score, threshold - 1) };
    if (score >= threshold) return { complianceStatus: "compliant", score };
    if (score >= Math.max(0, threshold - 25)) return { complianceStatus: "partial", score };
    return { complianceStatus: "non_compliant", score };
  }
}

export class GovernanceRiskAnalyzer {
  evaluate(input: CrossEmpireGovernanceInput, complianceStatus: string): RiskLevel {
    if (input.riskHint) return input.riskHint;
    if (input.violationHint === true || complianceStatus === "non_compliant") return "elevated";
    if (input.policyConflictHint === true || complianceStatus === "partial") return "moderate";
    return "low";
  }
}

export class GovernanceRecommendationEngine {
  summarize(input: CrossEmpireGovernanceInput, company: string, category: string): string {
    return input.recommendationSummary?.trim() || `Review constitutional governance consistency for ${company} (${category})`;
  }
}

export class GovernanceMetadataGenerator {
  version() {
    return CEG_METADATA_VERSION;
  }
  traceId(index: number) {
    return `ceg-trace-${Date.now()}-${index}`;
  }
}

export class GovernanceValidator {
  decide(input: CrossEmpireGovernanceInput): "pass" | "partial" | "fail" {
    if (input.validated === true && input.violationHint !== true) return "pass";
    if (input.violationHint === true && input.approveNonCompliant === true) return "fail";
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
