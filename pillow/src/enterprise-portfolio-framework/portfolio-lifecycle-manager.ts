/** X2-01 — Portfolio module lifecycle management. */

import { appendEpfLog } from "./epf-logging.js";
import type { PortfolioModuleRegistry } from "./portfolio-module-registry.js";
import type { ModuleState } from "./types.js";

const TRANSITIONS: Record<ModuleState, ModuleState[]> = {
  registered: ["initialized", "failed"],
  initialized: ["active", "suspended", "failed"],
  active: ["suspended", "shutdown", "failed"],
  suspended: ["active", "shutdown", "failed"],
  shutdown: [],
  failed: ["registered", "initialized"],
};

export class PortfolioLifecycleManager {
  canTransition(from: ModuleState, to: ModuleState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(
    registry: PortfolioModuleRegistry,
    portfolioModuleIdentifier: string,
    target: ModuleState,
  ): { ok: boolean; record: ReturnType<PortfolioModuleRegistry["get"]>; error?: string } {
    const current = registry.get(portfolioModuleIdentifier);
    if (!current) {
      return { ok: false, record: null, error: "Portfolio module not found" };
    }
    if (!this.canTransition(current.operationalState, target)) {
      return {
        ok: false,
        record: current,
        error: `Invalid transition ${current.operationalState} → ${target}`,
      };
    }
    const updated = registry.updateState(portfolioModuleIdentifier, target);
    appendEpfLog({
      event: `portfolio_module_${target}`,
      level: "info",
      details: `${portfolioModuleIdentifier}: ${current.operationalState} → ${target}`,
    });
    return { ok: true, record: updated };
  }

  initialize(registry: PortfolioModuleRegistry, portfolioModuleIdentifier: string) {
    return this.transition(registry, portfolioModuleIdentifier, "initialized");
  }

  activate(registry: PortfolioModuleRegistry, portfolioModuleIdentifier: string) {
    return this.transition(registry, portfolioModuleIdentifier, "active");
  }

  suspend(registry: PortfolioModuleRegistry, portfolioModuleIdentifier: string) {
    return this.transition(registry, portfolioModuleIdentifier, "suspended");
  }

  shutdown(registry: PortfolioModuleRegistry, portfolioModuleIdentifier: string) {
    return this.transition(registry, portfolioModuleIdentifier, "shutdown");
  }
}
