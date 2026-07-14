/** T2-01 — Rule violation record generation. */

import { RULE_METADATA_VERSION } from "./paths.js";
import type { RuleCategory, RuleSeverity, RuleViolation, UxRule } from "./types.js";

export type ViolationContext = {
  sourceUiStateId?: string | null;
  sourceComponentId?: string | null;
  sourceLayoutId?: string | null;
  sourceNavigationNodeId?: string | null;
  affectedScreenId?: string | null;
  affectedRouteOrView?: string | null;
  evidence?: Record<string, unknown>;
  description?: string;
};

export class RuleViolationGenerator {
  generate(rule: UxRule, context: ViolationContext = {}): RuleViolation {
    return {
      violationId: `ux-violation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ruleId: rule.ruleId,
      ruleName: rule.ruleName,
      category: rule.category,
      severity: rule.severity,
      sourceUiStateId: context.sourceUiStateId ?? null,
      sourceComponentId: context.sourceComponentId ?? null,
      sourceLayoutId: context.sourceLayoutId ?? null,
      sourceNavigationNodeId: context.sourceNavigationNodeId ?? null,
      affectedScreenId: context.affectedScreenId ?? null,
      affectedRouteOrView: context.affectedRouteOrView ?? null,
      violationDescription:
        context.description ?? `UX rule violation: ${rule.ruleName} (${rule.ruleId})`,
      evidenceMetadata: context.evidence ?? {},
      timestamp: new Date().toISOString(),
      metadataVersion: RULE_METADATA_VERSION,
    };
  }

  filterBySeverity(
    violations: RuleViolation[],
    severities: RuleSeverity[],
  ): RuleViolation[] {
    return violations.filter((v) => severities.includes(v.severity));
  }

  filterByCategory(
    violations: RuleViolation[],
    categories: RuleCategory[],
  ): RuleViolation[] {
    return violations.filter((v) => categories.includes(v.category));
  }
}
