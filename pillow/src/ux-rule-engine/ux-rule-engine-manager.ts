/** T2-01 — UX Rule Engine manager. */

import { appendUxRuleLog } from "./ux-rule-logging.js";
import { UxRuleLoader } from "./ux-rule-loader.js";
import { UxRuleRegistry } from "./ux-rule-registry.js";
import type { UxRuleEngineConfiguration } from "./configuration.js";
import type { UxRule } from "./types.js";

export class UxRuleEngineManager {
  private readonly registry = new UxRuleRegistry();
  private readonly loader = new UxRuleLoader();

  loadRules(repositoryRoot: string, config: UxRuleEngineConfiguration): number {
    this.registry.clear();
    const rules = this.loader.loadRules(repositoryRoot, config);
    this.registry.registerMany(rules);
    return this.registry.count();
  }

  getRegistry(): UxRuleRegistry {
    return this.registry;
  }

  getAllRules(): UxRule[] {
    return this.registry.getAllRules();
  }

  getEnabledRules(): UxRule[] {
    return this.registry.getEnabledRules();
  }

  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const status = enabled ? "enabled" : "disabled";
    const ok = this.registry.setRuleStatus(ruleId, status);
    if (ok) {
      appendUxRuleLog({
        event: "rule_status_changed",
        level: "info",
        details: `Rule ${ruleId} set to ${status}`,
      });
    }
    return ok;
  }

  rulesLoaded(): number {
    return this.registry.count();
  }

  rulesEnabled(): number {
    return this.registry.countEnabled();
  }
}
