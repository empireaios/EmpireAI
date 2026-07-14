/** T2-01 — UX rule evaluation dispatcher. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import { ComponentRuleEvaluator } from "./component-rule-evaluator.js";
import { LayoutRuleEvaluator } from "./layout-rule-evaluator.js";
import { NavigationRuleEvaluator } from "./navigation-rule-evaluator.js";
import { RuleViolationGenerator } from "./rule-violation-generator.js";
import { UiStateRuleEvaluator } from "./ui-state-rule-evaluator.js";
import type { RuleEvaluationResult, UxRule } from "./types.js";

export type EvaluationContext = {
  uiState?: UiStateModel | null;
  recognition?: ComponentRecognitionResult | null;
  layout?: LayoutModel | null;
  navigation?: NavigationGraph | null;
};

export class UxRuleEvaluator {
  private readonly uiStateEvaluator = new UiStateRuleEvaluator();
  private readonly componentEvaluator = new ComponentRuleEvaluator();
  private readonly layoutEvaluator = new LayoutRuleEvaluator();
  private readonly navigationEvaluator = new NavigationRuleEvaluator();
  private readonly violationGenerator = new RuleViolationGenerator();

  evaluateRule(rule: UxRule, context: EvaluationContext): RuleEvaluationResult {
    const started = Date.now();

    if (rule.status === "disabled") {
      return {
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        category: rule.category,
        severity: rule.severity,
        targetType: rule.targetType,
        passed: true,
        skipped: true,
        skipReason: "Rule disabled",
        violation: null,
        durationMs: Date.now() - started,
      };
    }

    try {
      switch (rule.targetType) {
        case "ui_state": {
          const outcome = this.uiStateEvaluator.evaluate(rule, context.uiState ?? null);
          const violation = outcome.passed
            ? null
            : this.violationGenerator.generate(rule, {
                sourceUiStateId: outcome.sourceUiStateId,
                affectedScreenId: outcome.affectedScreenId,
                description: outcome.description,
                evidence: outcome.evidence,
              });
          return {
            ruleId: rule.ruleId,
            ruleName: rule.ruleName,
            category: rule.category,
            severity: rule.severity,
            targetType: rule.targetType,
            passed: outcome.passed,
            skipped: false,
            skipReason: null,
            violation,
            durationMs: Date.now() - started,
          };
        }

        case "component": {
          const outcome = this.componentEvaluator.evaluate(
            rule,
            context.recognition ?? null,
          );
          const violation = outcome.passed
            ? null
            : this.violationGenerator.generate(rule, {
                sourceUiStateId: outcome.sourceUiStateId,
                sourceComponentId: outcome.sourceComponentId,
                affectedScreenId: outcome.affectedScreenId,
                description: outcome.description,
                evidence: outcome.evidence,
              });
          return {
            ruleId: rule.ruleId,
            ruleName: rule.ruleName,
            category: rule.category,
            severity: rule.severity,
            targetType: rule.targetType,
            passed: outcome.passed,
            skipped: false,
            skipReason: null,
            violation,
            durationMs: Date.now() - started,
          };
        }

        case "layout": {
          const outcome = this.layoutEvaluator.evaluate(rule, context.layout ?? null);
          const violation = outcome.passed
            ? null
            : this.violationGenerator.generate(rule, {
                sourceUiStateId: outcome.sourceUiStateId,
                sourceLayoutId: outcome.sourceLayoutId,
                affectedScreenId: outcome.affectedScreenId,
                description: outcome.description,
                evidence: outcome.evidence,
              });
          return {
            ruleId: rule.ruleId,
            ruleName: rule.ruleName,
            category: rule.category,
            severity: rule.severity,
            targetType: rule.targetType,
            passed: outcome.passed,
            skipped: false,
            skipReason: null,
            violation,
            durationMs: Date.now() - started,
          };
        }

        case "navigation": {
          const outcome = this.navigationEvaluator.evaluate(
            rule,
            context.navigation ?? null,
          );
          const violation = outcome.passed
            ? null
            : this.violationGenerator.generate(rule, {
                sourceLayoutId: outcome.sourceLayoutId,
                sourceNavigationNodeId: outcome.sourceNavigationNodeId,
                affectedScreenId: outcome.affectedScreenId,
                affectedRouteOrView: outcome.affectedRouteOrView,
                description: outcome.description,
                evidence: outcome.evidence,
              });
          return {
            ruleId: rule.ruleId,
            ruleName: rule.ruleName,
            category: rule.category,
            severity: rule.severity,
            targetType: rule.targetType,
            passed: outcome.passed,
            skipped: false,
            skipReason: null,
            violation,
            durationMs: Date.now() - started,
          };
        }

        default:
          return {
            ruleId: rule.ruleId,
            ruleName: rule.ruleName,
            category: rule.category,
            severity: rule.severity,
            targetType: rule.targetType,
            passed: true,
            skipped: true,
            skipReason: `Unknown target type: ${rule.targetType}`,
            violation: null,
            durationMs: Date.now() - started,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rule evaluation failed";
      return {
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        category: rule.category,
        severity: rule.severity,
        targetType: rule.targetType,
        passed: false,
        skipped: false,
        skipReason: null,
        violation: this.violationGenerator.generate(rule, {
          description: message,
          evidence: { evaluationError: true },
        }),
        durationMs: Date.now() - started,
      };
    }
  }

  evaluateRules(rules: UxRule[], context: EvaluationContext): RuleEvaluationResult[] {
    return rules.map((rule) => this.evaluateRule(rule, context));
  }
}
