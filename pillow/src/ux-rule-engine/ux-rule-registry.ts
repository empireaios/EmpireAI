/** T2-01 — UX rule registry. */

import { appendUxRuleLog } from "./ux-rule-logging.js";
import type { RuleCategory, RuleTargetType, UxRule } from "./types.js";

export class UxRuleRegistry {
  private rules = new Map<string, UxRule>();

  register(rule: UxRule): void {
    this.rules.set(rule.ruleId, rule);
    appendUxRuleLog({
      event: "rule_registered",
      level: "info",
      details: `Registered rule ${rule.ruleId} (${rule.ruleName})`,
    });
  }

  registerMany(rules: UxRule[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  getRule(ruleId: string): UxRule | null {
    return this.rules.get(ruleId) ?? null;
  }

  getAllRules(): UxRule[] {
    return [...this.rules.values()];
  }

  getEnabledRules(): UxRule[] {
    return this.getAllRules().filter((r) => r.status === "enabled");
  }

  getRulesByTarget(targetType: RuleTargetType): UxRule[] {
    return this.getEnabledRules().filter((r) => r.targetType === targetType);
  }

  getRulesByCategory(category: RuleCategory): UxRule[] {
    return this.getEnabledRules().filter((r) => r.category === category);
  }

  setRuleStatus(ruleId: string, status: UxRule["status"]): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.status = status;
    rule.updatedTimestamp = new Date().toISOString();
    return true;
  }

  clear(): void {
    this.rules.clear();
  }

  count(): number {
    return this.rules.size;
  }

  countEnabled(): number {
    return this.getEnabledRules().length;
  }
}
