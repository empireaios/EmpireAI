/** T2-01 — Rule metadata generation. */

import { RULE_METADATA_VERSION } from "./paths.js";
import type { UxRule } from "./types.js";

export class RuleMetadataGenerator {
  enrichRule(rule: UxRule): UxRule {
    const now = new Date().toISOString();
    return {
      ...rule,
      metadataVersion: rule.metadataVersion || RULE_METADATA_VERSION,
      createdTimestamp: rule.createdTimestamp || now,
      updatedTimestamp: now,
    };
  }

  validateRuleMetadata(rule: UxRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!rule.ruleId) errors.push("Missing ruleId");
    if (!rule.ruleName) errors.push("Missing ruleName");
    if (!rule.category) errors.push("Missing category");
    if (!rule.targetType) errors.push("Missing targetType");
    if (!rule.evaluationLogic?.evaluator) errors.push("Missing evaluator");
    if (!rule.severity) errors.push("Missing severity");
    return { valid: errors.length === 0, errors };
  }
}
