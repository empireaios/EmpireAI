/** X4-01 — Scaling module lifecycle management. */

import { appendGefLog } from "./gef-logging.js";
import type { GlobalModuleRegistry } from "./global-module-registry.js";
import type { ModuleState } from "./types.js";

const TRANSITIONS: Record<ModuleState, ModuleState[]> = {
  registered: ["initialized", "failed"],
  initialized: ["active", "suspended", "failed"],
  active: ["suspended", "shutdown", "failed"],
  suspended: ["active", "shutdown", "failed"],
  shutdown: [],
  failed: ["registered", "initialized"],
};

export class ExpansionLifecycleManager {
  canTransition(from: ModuleState, to: ModuleState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(
    registry: GlobalModuleRegistry,
    expansionModuleIdentifier: string,
    target: ModuleState,
  ): { ok: boolean; record: ReturnType<GlobalModuleRegistry["get"]>; error?: string } {
    const current = registry.get(expansionModuleIdentifier);
    if (!current) {
      return { ok: false, record: null, error: "Scaling module not found" };
    }
    if (!this.canTransition(current.operationalState, target)) {
      return {
        ok: false,
        record: current,
        error: `Invalid transition ${current.operationalState} → ${target}`,
      };
    }
    const updated = registry.updateState(expansionModuleIdentifier, target);
    appendGefLog({
      event: `expansion_module_${target}`,
      level: "info",
      details: `${expansionModuleIdentifier}: ${current.operationalState} → ${target}`,
    });
    return { ok: true, record: updated };
  }

  initialize(registry: GlobalModuleRegistry, expansionModuleIdentifier: string) {
    return this.transition(registry, expansionModuleIdentifier, "initialized");
  }

  activate(registry: GlobalModuleRegistry, expansionModuleIdentifier: string) {
    return this.transition(registry, expansionModuleIdentifier, "active");
  }

  suspend(registry: GlobalModuleRegistry, expansionModuleIdentifier: string) {
    return this.transition(registry, expansionModuleIdentifier, "suspended");
  }

  shutdown(registry: GlobalModuleRegistry, expansionModuleIdentifier: string) {
    return this.transition(registry, expansionModuleIdentifier, "shutdown");
  }
}
