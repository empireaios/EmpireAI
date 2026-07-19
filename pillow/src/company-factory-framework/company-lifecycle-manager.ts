/** X1-01 — Company module lifecycle management. */

import { appendFrameworkLog } from "./cff-logging.js";
import type { CompanyModuleRegistry } from "./company-module-registry.js";
import type { ModuleState } from "./types.js";

const TRANSITIONS: Record<ModuleState, ModuleState[]> = {
  registered: ["initialized", "failed"],
  initialized: ["active", "suspended", "failed"],
  active: ["suspended", "shutdown", "failed"],
  suspended: ["active", "shutdown", "failed"],
  shutdown: [],
  failed: ["registered", "initialized"],
};

export class CompanyLifecycleManager {
  canTransition(from: ModuleState, to: ModuleState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(
    registry: CompanyModuleRegistry,
    companyModuleIdentifier: string,
    target: ModuleState,
  ): { ok: boolean; record: ReturnType<CompanyModuleRegistry["get"]>; error?: string } {
    const current = registry.get(companyModuleIdentifier);
    if (!current) {
      return { ok: false, record: null, error: "Company module not found" };
    }
    if (!this.canTransition(current.operationalState, target)) {
      return {
        ok: false,
        record: current,
        error: `Invalid transition ${current.operationalState} → ${target}`,
      };
    }
    const updated = registry.updateState(companyModuleIdentifier, target);
    appendFrameworkLog({
      event: `company_module_${target}`,
      level: "info",
      details: `${companyModuleIdentifier}: ${current.operationalState} → ${target}`,
    });
    return { ok: true, record: updated };
  }

  initialize(registry: CompanyModuleRegistry, companyModuleIdentifier: string) {
    return this.transition(registry, companyModuleIdentifier, "initialized");
  }

  activate(registry: CompanyModuleRegistry, companyModuleIdentifier: string) {
    return this.transition(registry, companyModuleIdentifier, "active");
  }

  suspend(registry: CompanyModuleRegistry, companyModuleIdentifier: string) {
    return this.transition(registry, companyModuleIdentifier, "suspended");
  }

  shutdown(registry: CompanyModuleRegistry, companyModuleIdentifier: string) {
    return this.transition(registry, companyModuleIdentifier, "shutdown");
  }
}
