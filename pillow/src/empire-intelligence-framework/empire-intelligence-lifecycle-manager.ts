import type { EmpireIntelligenceModuleRegistry } from "./empire-intelligence-module-registry.js";
import type { ModuleState } from "./types.js";
export class EmpireIntelligenceLifecycleManager {
  transition(registry: EmpireIntelligenceModuleRegistry, id: string, state: ModuleState) {
    return registry.setState(id, state);
  }
  start(registry: EmpireIntelligenceModuleRegistry, id: string) { return this.transition(registry, id, "active"); }
  stop(registry: EmpireIntelligenceModuleRegistry, id: string) { return this.transition(registry, id, "shutdown"); }
}
