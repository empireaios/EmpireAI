import type { ApprovalRouterConfiguration, ApprovalPolicyRule } from "./configuration.js";
import type { ApprovalLevel, ApprovalRouterInput } from "./types.js";

export type PolicyClassification = {
  level: ApprovalLevel;
  reason: string;
  policyRuleId: string | null;
  approvalRequired: boolean;
};

export class ApprovalPolicyClassifier {
  classify(input: ApprovalRouterInput, configuration: ApprovalRouterConfiguration): PolicyClassification {
    if (input.forceApprovalLevel) {
      return {
        level: input.forceApprovalLevel,
        reason: `Forced approval level: ${input.forceApprovalLevel}`,
        policyRuleId: "forced",
        approvalRequired: input.forceApprovalLevel !== "autonomous",
      };
    }

    const haystack = [
      input.requestedAction,
      input.requestSummary,
      ...(input.riskHints ?? []),
      ...(input.impactHints ?? []),
      ...(input.policyHints ?? []),
    ]
      .join(" ")
      .toLowerCase();

    const matched = [...configuration.policyRules]
      .sort((a, b) => b.priority - a.priority)
      .find((rule) => this.matches(rule, haystack));

    if (matched) {
      return {
        level: matched.level,
        reason: matched.reason,
        policyRuleId: matched.ruleId,
        approvalRequired: matched.level !== "autonomous",
      };
    }

    return {
      level: configuration.defaultApprovalLevel,
      reason: `Default policy level: ${configuration.defaultApprovalLevel}`,
      policyRuleId: null,
      approvalRequired: configuration.defaultApprovalLevel !== "autonomous",
    };
  }

  private matches(rule: ApprovalPolicyRule, haystack: string): boolean {
    return rule.matchPatterns.some((pattern) => haystack.includes(pattern.toLowerCase()));
  }
}
