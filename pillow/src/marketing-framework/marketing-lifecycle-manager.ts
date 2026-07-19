/** R5-01 — Marketing module lifecycle management. */

import { appendFrameworkLog } from "./mfw-logging.js";
import type { MarketingModuleRegistry } from "./marketing-module-registry.js";
import type { ModuleState } from "./types.js";

const TRANSITIONS: Record<ModuleState, ModuleState[]> = {
  registered: ["initialized", "failed"],
  initialized: ["active", "suspended", "failed"],
  active: ["suspended", "shutdown", "failed"],
  suspended: ["active", "shutdown", "failed"],
  shutdown: [],
  failed: ["registered", "initialized"],
};

export class MarketingLifecycleManager {
  canTransition(from: ModuleState, to: ModuleState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(
    registry: MarketingModuleRegistry,
    marketingModuleIdentifier: string,
    target: ModuleState,
  ): { ok: boolean; record: ReturnType<MarketingModuleRegistry["get"]>; error?: string } {
    const current = registry.get(marketingModuleIdentifier);
    if (!current) {
      return { ok: false, record: null, error: "Marketing module not found" };
    }
    if (!this.canTransition(current.operationalState, target)) {
      return {
        ok: false,
        record: current,
        error: `Invalid transition ${current.operationalState} → ${target}`,
      };
    }
    const updated = registry.updateState(marketingModuleIdentifier, target);
    appendFrameworkLog({
      event: `marketing_module_${target}`,
      level: "info",
      details: `${marketingModuleIdentifier}: ${current.operationalState} → ${target}`,
    });
    return { ok: true, record: updated };
  }

  initialize(registry: MarketingModuleRegistry, marketingModuleIdentifier: string) {
    return this.transition(registry, marketingModuleIdentifier, "initialized");
  }

  activate(registry: MarketingModuleRegistry, marketingModuleIdentifier: string) {
    return this.transition(registry, marketingModuleIdentifier, "active");
  }

  suspend(registry: MarketingModuleRegistry, marketingModuleIdentifier: string) {
    return this.transition(registry, marketingModuleIdentifier, "suspended");
  }

  shutdown(registry: MarketingModuleRegistry, marketingModuleIdentifier: string) {
    return this.transition(registry, marketingModuleIdentifier, "shutdown");
  }
}
