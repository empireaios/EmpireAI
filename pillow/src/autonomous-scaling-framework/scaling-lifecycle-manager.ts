/** X3-01 — Scaling module lifecycle management. */

import { appendAsfLog } from "./asf-logging.js";
import type { ScalingModuleRegistry } from "./scaling-module-registry.js";
import type { ModuleState } from "./types.js";

const TRANSITIONS: Record<ModuleState, ModuleState[]> = {
  registered: ["initialized", "failed"],
  initialized: ["active", "suspended", "failed"],
  active: ["suspended", "shutdown", "failed"],
  suspended: ["active", "shutdown", "failed"],
  shutdown: [],
  failed: ["registered", "initialized"],
};

export class ScalingLifecycleManager {
  canTransition(from: ModuleState, to: ModuleState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(
    registry: ScalingModuleRegistry,
    scalingModuleIdentifier: string,
    target: ModuleState,
  ): { ok: boolean; record: ReturnType<ScalingModuleRegistry["get"]>; error?: string } {
    const current = registry.get(scalingModuleIdentifier);
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
    const updated = registry.updateState(scalingModuleIdentifier, target);
    appendAsfLog({
      event: `scaling_module_${target}`,
      level: "info",
      details: `${scalingModuleIdentifier}: ${current.operationalState} → ${target}`,
    });
    return { ok: true, record: updated };
  }

  initialize(registry: ScalingModuleRegistry, scalingModuleIdentifier: string) {
    return this.transition(registry, scalingModuleIdentifier, "initialized");
  }

  activate(registry: ScalingModuleRegistry, scalingModuleIdentifier: string) {
    return this.transition(registry, scalingModuleIdentifier, "active");
  }

  suspend(registry: ScalingModuleRegistry, scalingModuleIdentifier: string) {
    return this.transition(registry, scalingModuleIdentifier, "suspended");
  }

  shutdown(registry: ScalingModuleRegistry, scalingModuleIdentifier: string) {
    return this.transition(registry, scalingModuleIdentifier, "shutdown");
  }
}
