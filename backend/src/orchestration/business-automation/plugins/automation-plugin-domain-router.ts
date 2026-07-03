/**
 * G5-09 — Routes automation plugin hooks to domain registries without modifying core engines.
 */

import type { AutomationCentreWidgetPlugin } from "../cockpit/automation-centre-plugin-registry.js";
import { automationCentrePluginRegistry } from "../cockpit/automation-centre-plugin-registry.js";
import type { AutomationPluginCategory } from "../contracts/automation-plugin-types.js";
import type { KnowledgeProviderPlugin } from "../outcome/outcome-plugin-registry.js";
import { outcomePluginRegistry } from "../outcome/outcome-plugin-registry.js";
import type { ExecutionValidatorPlugin } from "../orchestrator/orchestrator-plugin-registry.js";
import { orchestratorPluginRegistry } from "../orchestrator/orchestrator-plugin-registry.js";
import type { TriggerValidatorPlugin } from "../triggers/trigger-plugin-registry.js";
import { triggerPluginRegistry } from "../triggers/trigger-plugin-registry.js";
import type { FailureAnalyserPlugin } from "../recovery/recovery-plugin-registry.js";
import { recoveryPluginRegistry } from "../recovery/recovery-plugin-registry.js";

export type AutomationPluginHookBundle = {
  triggerValidator?: TriggerValidatorPlugin;
  orchestratorValidator?: ExecutionValidatorPlugin;
  recoveryFailureAnalyser?: FailureAnalyserPlugin;
  cockpitWidget?: AutomationCentreWidgetPlugin;
  outcomeKnowledgeProvider?: KnowledgeProviderPlugin;
};

export class AutomationPluginDomainRouter {
  private readonly wiredPlugins = new Set<string>();

  applyHooks(
    pluginId: string,
    category: AutomationPluginCategory,
    hooks: AutomationPluginHookBundle,
  ): void {
    if (hooks.triggerValidator) {
      triggerPluginRegistry.registerValidator(hooks.triggerValidator);
    }
    if (hooks.orchestratorValidator) {
      orchestratorPluginRegistry.registerValidator(hooks.orchestratorValidator);
    }
    if (hooks.recoveryFailureAnalyser) {
      recoveryPluginRegistry.registerFailureAnalyser(hooks.recoveryFailureAnalyser);
    }
    if (hooks.cockpitWidget) {
      automationCentrePluginRegistry.registerWidget(hooks.cockpitWidget);
    }
    if (hooks.outcomeKnowledgeProvider) {
      outcomePluginRegistry.registerKnowledgeProvider(hooks.outcomeKnowledgeProvider);
    }

    if (
      hooks.triggerValidator ||
      hooks.orchestratorValidator ||
      hooks.recoveryFailureAnalyser ||
      hooks.cockpitWidget ||
      hooks.outcomeKnowledgeProvider
    ) {
      this.wiredPlugins.add(pluginId);
    }

    void category;
  }

  removeHooks(pluginId: string): void {
    triggerPluginRegistry.removePlugin(pluginId);
    orchestratorPluginRegistry.removePlugin(pluginId);
    recoveryPluginRegistry.removePlugin(pluginId);
    automationCentrePluginRegistry.removePlugin(pluginId);
    outcomePluginRegistry.removePlugin(pluginId);
    this.wiredPlugins.delete(pluginId);
  }

  isWired(pluginId: string): boolean {
    return this.wiredPlugins.has(pluginId);
  }

  resetForTests(): void {
    this.wiredPlugins.clear();
  }
}

let sharedRouter: AutomationPluginDomainRouter | undefined;

export function getAutomationPluginDomainRouter(): AutomationPluginDomainRouter {
  if (!sharedRouter) {
    sharedRouter = new AutomationPluginDomainRouter();
  }
  return sharedRouter;
}

export function resetAutomationPluginDomainRouterForTests(): void {
  sharedRouter = undefined;
}
