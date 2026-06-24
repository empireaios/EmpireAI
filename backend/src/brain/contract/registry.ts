import type { IntelligenceModuleContract } from "./intelligence-module.js";
import type { IntelligenceModuleId } from "./module-ids.js";

/** Registry interface for discovering and invoking intelligence module contracts. */
export interface IntelligenceModuleRegistry {
  register(module: IntelligenceModuleContract): void;
  unregister(moduleId: IntelligenceModuleId): boolean;
  get(moduleId: IntelligenceModuleId): IntelligenceModuleContract | undefined;
  list(): IntelligenceModuleContract[];
  has(moduleId: IntelligenceModuleId): boolean;
}

/**
 * Stub registry — holds contract implementations when registered.
 * No modules are pre-registered; existing engines remain independent until adapted.
 */
export class StubIntelligenceModuleRegistry implements IntelligenceModuleRegistry {
  private readonly modules = new Map<IntelligenceModuleId, IntelligenceModuleContract>();

  register(module: IntelligenceModuleContract): void {
    this.modules.set(module.moduleId, module);
  }

  unregister(moduleId: IntelligenceModuleId): boolean {
    return this.modules.delete(moduleId);
  }

  get(moduleId: IntelligenceModuleId): IntelligenceModuleContract | undefined {
    return this.modules.get(moduleId);
  }

  list(): IntelligenceModuleContract[] {
    return [...this.modules.values()];
  }

  has(moduleId: IntelligenceModuleId): boolean {
    return this.modules.has(moduleId);
  }
}

export const intelligenceModuleRegistry = new StubIntelligenceModuleRegistry();
