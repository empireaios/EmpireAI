/** R3-01 — Financial module lifecycle management. */

import { appendFrameworkLog } from "./ff-logging.js";
import type { FinancialModuleRegistry } from "./financial-module-registry.js";
import type { ModuleState } from "./types.js";

const TRANSITIONS: Record<ModuleState, ModuleState[]> = {
  registered: ["initialized", "failed"],
  initialized: ["active", "suspended", "failed"],
  active: ["suspended", "shutdown", "failed"],
  suspended: ["active", "shutdown", "failed"],
  shutdown: [],
  failed: ["registered", "initialized"],
};

export class FinancialLifecycleManager {
  canTransition(from: ModuleState, to: ModuleState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(
    registry: FinancialModuleRegistry,
    financialModuleIdentifier: string,
    target: ModuleState,
  ): { ok: boolean; record: ReturnType<FinancialModuleRegistry["get"]>; error?: string } {
    const current = registry.get(financialModuleIdentifier);
    if (!current) {
      return { ok: false, record: null, error: "Financial module not found" };
    }
    if (!this.canTransition(current.operationalState, target)) {
      return {
        ok: false,
        record: current,
        error: `Invalid transition ${current.operationalState} → ${target}`,
      };
    }
    const updated = registry.updateState(financialModuleIdentifier, target);
    appendFrameworkLog({
      event: `financial_module_${target}`,
      level: "info",
      details: `${financialModuleIdentifier}: ${current.operationalState} → ${target}`,
    });
    return { ok: true, record: updated };
  }

  initialize(registry: FinancialModuleRegistry, financialModuleIdentifier: string) {
    return this.transition(registry, financialModuleIdentifier, "initialized");
  }

  activate(registry: FinancialModuleRegistry, financialModuleIdentifier: string) {
    return this.transition(registry, financialModuleIdentifier, "active");
  }

  suspend(registry: FinancialModuleRegistry, financialModuleIdentifier: string) {
    return this.transition(registry, financialModuleIdentifier, "suspended");
  }

  shutdown(registry: FinancialModuleRegistry, financialModuleIdentifier: string) {
    return this.transition(registry, financialModuleIdentifier, "shutdown");
  }
}
