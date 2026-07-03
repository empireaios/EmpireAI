/**
 * G5-02 — Trigger plugin registry (providers, validators, enrichers).
 */

import type { TriggerCategory, TriggerContext, TriggerIntakeRequest } from "../contracts/trigger-types.js";

export type TriggerProviderPlugin = {
  pluginId: string;
  category: TriggerCategory;
  resolveTriggerIds?: (intake: TriggerIntakeRequest) => string[];
};

export type TriggerValidatorPlugin = {
  pluginId: string;
  validate: (intake: TriggerIntakeRequest, context: TriggerContext) => { valid: boolean; reason: string };
};

export type TriggerEnricherPlugin = {
  pluginId: string;
  enrich: (
    context: TriggerContext,
    intake: TriggerIntakeRequest,
  ) => TriggerContext;
};

export class TriggerPluginRegistry {
  private readonly providers = new Map<string, TriggerProviderPlugin>();
  private readonly validators = new Map<string, TriggerValidatorPlugin>();
  private readonly enrichers = new Map<string, TriggerEnricherPlugin>();

  registerProvider(plugin: TriggerProviderPlugin): void {
    this.providers.set(plugin.pluginId, plugin);
  }

  registerValidator(plugin: TriggerValidatorPlugin): void {
    this.validators.set(plugin.pluginId, plugin);
  }

  registerEnricher(plugin: TriggerEnricherPlugin): void {
    this.enrichers.set(plugin.pluginId, plugin);
  }

  listProviders(): readonly TriggerProviderPlugin[] {
    return [...this.providers.values()];
  }

  resolveProviderTriggerIds(intake: TriggerIntakeRequest): string[] {
    const ids: string[] = [];
    for (const provider of this.providers.values()) {
      if (provider.category !== intake.category) continue;
      ids.push(...(provider.resolveTriggerIds?.(intake) ?? []));
    }
    return ids;
  }

  runValidators(
    intake: TriggerIntakeRequest,
    context: TriggerContext,
  ): { valid: boolean; reason: string } {
    for (const validator of this.validators.values()) {
      const result = validator.validate(intake, context);
      if (!result.valid) {
        return { valid: false, reason: `[${validator.pluginId}] ${result.reason}` };
      }
    }
    return { valid: true, reason: "Plugin validators passed" };
  }

  applyEnrichers(context: TriggerContext, intake: TriggerIntakeRequest): TriggerContext {
    let enriched = context;
    for (const enricher of this.enrichers.values()) {
      enriched = enricher.enrich(enriched, intake);
    }
    return enriched;
  }

  resetForTests(): void {
    this.providers.clear();
    this.validators.clear();
    this.enrichers.clear();
  }

  removePlugin(pluginId: string): void {
    this.providers.delete(pluginId);
    this.validators.delete(pluginId);
    this.enrichers.delete(pluginId);
  }
}

export const triggerPluginRegistry = new TriggerPluginRegistry();

export function resetTriggerPluginRegistryForTests(): void {
  triggerPluginRegistry.resetForTests();
}
