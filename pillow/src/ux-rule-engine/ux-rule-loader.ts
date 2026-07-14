/** T2-01 — UX rule loader from configuration and external sources. */

import { readFileSync, existsSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { appendUxRuleLog } from "./ux-rule-logging.js";
import { DEFAULT_UX_RULES } from "./default-rules.js";
import { RuleMetadataGenerator } from "./rule-metadata-generator.js";
import type { UxRuleEngineConfiguration } from "./configuration.js";
import type { UxRule } from "./types.js";

export class UxRuleLoader {
  private readonly metadataGenerator = new RuleMetadataGenerator();

  loadRules(repositoryRoot: string, config: UxRuleEngineConfiguration): UxRule[] {
    const loaded: UxRule[] = [];
    const invalid: string[] = [];

    for (const rule of DEFAULT_UX_RULES) {
      const enriched = this.metadataGenerator.enrichRule(rule);
      const validation = this.metadataGenerator.validateRuleMetadata(enriched);
      if (validation.valid) {
        loaded.push(enriched);
      } else {
        invalid.push(`${rule.ruleId}: ${validation.errors.join(", ")}`);
      }
    }

    const external = this.loadExternalRules(repositoryRoot, config.ruleSourceLocation);
    for (const rule of external) {
      const enriched = this.metadataGenerator.enrichRule(rule);
      const validation = this.metadataGenerator.validateRuleMetadata(enriched);
      if (validation.valid) {
        const existing = loaded.findIndex((r) => r.ruleId === enriched.ruleId);
        if (existing >= 0) {
          loaded[existing] = enriched;
        } else {
          loaded.push(enriched);
        }
      } else {
        invalid.push(`${rule.ruleId}: ${validation.errors.join(", ")}`);
      }
    }

    const filtered = loaded.filter(
      (r) =>
        config.ruleCategories.includes(r.category) &&
        config.ruleSeverityLevels.includes(r.severity) &&
        config.ruleTargetTypes.includes(r.targetType),
    );

    appendUxRuleLog({
      event: "rules_loaded",
      level: invalid.length > 0 ? "warn" : "info",
      details: `Loaded ${filtered.length} UX rules (${invalid.length} invalid skipped)`,
    });

    for (const msg of invalid) {
      appendUxRuleLog({
        event: "invalid_rule_definition",
        level: "warn",
        details: msg,
      });
    }

    return filtered;
  }

  private loadExternalRules(repositoryRoot: string, sourceLocation: string): UxRule[] {
    const path = isAbsolute(sourceLocation)
      ? sourceLocation
      : join(repositoryRoot, sourceLocation);
    if (!existsSync(path)) {
      appendUxRuleLog({
        event: "rule_source_missing",
        level: "info",
        details: `External rule source not found: ${sourceLocation}`,
      });
      return [];
    }

    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as { rules?: UxRule[] } | UxRule[];
      const rules = Array.isArray(raw) ? raw : (raw.rules ?? []);
      appendUxRuleLog({
        event: "rule_loading",
        level: "info",
        details: `Loaded ${rules.length} rules from ${sourceLocation}`,
      });
      return rules;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse rule file";
      appendUxRuleLog({
        event: "rule_loading_failed",
        level: "error",
        details: message,
      });
      return [];
    }
  }
}
