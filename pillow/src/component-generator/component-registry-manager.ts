/** T3-02 — Component registry — duplicate avoidance. */

import type { RegistryUpdate } from "./types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import { appendGenerationLog } from "./generation-logging.js";

const globalRegistry = new Map<string, string>();

export class ComponentRegistryManager {
  checkAndRegister(
    componentName: string,
    targetPath: string,
    config: ComponentGeneratorConfiguration,
  ): RegistryUpdate {
    if (config.avoidDuplicateComponents && globalRegistry.has(componentName)) {
      appendGenerationLog({
        event: "registry_duplicate_skip",
        level: "warn",
        details: `Skipping duplicate component: ${componentName}`,
      });
      return {
        registryId: `reg-skip-${componentName}`,
        componentName,
        action: "skip_duplicate",
        targetPath,
      };
    }

    globalRegistry.set(componentName, targetPath);
    appendGenerationLog({
      event: "registry_update",
      level: "info",
      details: `Registered component: ${componentName} → ${targetPath}`,
    });

    return {
      registryId: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      componentName,
      action: "register",
      targetPath,
    };
  }

  resetForTesting(): void {
    globalRegistry.clear();
  }
}

export function resetComponentRegistryForTesting(): void {
  globalRegistry.clear();
}
