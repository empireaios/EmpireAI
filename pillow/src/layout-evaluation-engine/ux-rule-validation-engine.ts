/** T2-04 — UX rule validation for layout evaluation. */

import { LayoutRuleEvaluator } from "../ux-rule-engine/layout-rule-evaluator.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { RuleViolation } from "../ux-rule-engine/types.js";
import { appendLayoutEvaluationLog } from "./layout-evaluation-logging.js";

export class UxRuleValidationEngine {
  private readonly layoutEvaluator = new LayoutRuleEvaluator();

  validate(
    uxRuleEngine: UxRuleEngine,
    layout: LayoutModel | null,
    enabled: boolean,
  ): RuleViolation[] {
    if (!enabled) return [];

    appendLayoutEvaluationLog({
      event: "rule_validation",
      level: "info",
      details: "Validating layout against UX rules",
    });

    const violations: RuleViolation[] = [];
    const rules = uxRuleEngine.getRules().filter(
      (r) => r.status === "enabled" && r.targetType === "layout",
    );

    for (const rule of rules) {
      const outcome = this.layoutEvaluator.evaluate(rule, layout);
      if (!outcome.passed && !outcome.evidence.skipped) {
        violations.push({
          violationId: `lev-violation-${rule.ruleId}-${Date.now()}`,
          ruleId: rule.ruleId,
          ruleName: rule.ruleName,
          category: rule.category,
          severity: rule.severity,
          sourceUiStateId: outcome.sourceUiStateId,
          sourceComponentId: null,
          sourceLayoutId: outcome.sourceLayoutId,
          sourceNavigationNodeId: null,
          affectedScreenId: outcome.affectedScreenId,
          affectedRouteOrView: null,
          violationDescription: outcome.description,
          evidenceMetadata: outcome.evidence,
          timestamp: new Date().toISOString(),
          metadataVersion: rule.metadataVersion,
        });
      }
    }

    return violations;
  }
}
